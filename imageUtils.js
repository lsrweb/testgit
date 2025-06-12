/**
 * 图像处理工具类 - 专注于GIF压缩和优化
 * 支持gif.js库进行高质量压缩，提供兜底方案
 */
class ImageUtils {
  constructor() {
    this.gifJsAvailable = this.checkGifJsAvailability();
    console.log(`ImageUtils初始化: gif.js ${this.gifJsAvailable ? '可用' : '不可用'}`);
  }

  /**
   * 检查gif.js库是否可用
   */
  checkGifJsAvailability() {
    return typeof window !== 'undefined' && 
           typeof window.GIF !== 'undefined' && 
           typeof window.GIF === 'function';
  }

  /**
   * 压缩GIF文件 - 主要入口函数
   * @param {Object} gifData - 解析后的GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob|string>} 压缩后的GIF文件或base64数据
   */
  async compressGif(gifData, options = {}) {
    const defaultOptions = {
      width: null,           // 目标宽度，null表示保持原始
      height: null,          // 目标高度，null表示保持原始
      quality: 10,           // 压缩质量 1-30 (数字越低质量越高)
      workers: 2,            // 工作线程数
      workerScript: 'gif.worker.js', // worker脚本路径
      dither: false,         // 是否启用抖动
      debug: false,          // 调试模式
      repeat: 0,             // 循环次数，0表示无限循环
      transparent: null,     // 透明色
      background: null,      // 背景色
      maxColors: 256,        // 最大颜色数
      ...options
    };

    if (this.gifJsAvailable) {
      return await this.compressWithGifJs(gifData, defaultOptions);
    } else {
      console.warn('gif.js不可用，使用兜底压缩方案');
      return await this.compressWithFallback(gifData, defaultOptions);
    }
  }  /**
   * 使用gif.js进行压缩
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob>} 压缩后的GIF Blob
   */
  async compressWithGifJs(gifData, options) {
    return new Promise((resolve, reject) => {
      try {
        // 计算目标尺寸
        const originalWidth = gifData.logicalScreen.width;
        const originalHeight = gifData.logicalScreen.height;
        const targetWidth = options.width || originalWidth;
        const targetHeight = options.height || originalHeight;
        
        // 计算压缩比例
        const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
        const finalWidth = Math.round(originalWidth * scale);
        const finalHeight = Math.round(originalHeight * scale);

        console.log(`压缩设置: ${originalWidth}x${originalHeight} -> ${finalWidth}x${finalHeight}, 质量=${options.quality}`);        // 创建GIF实例 - 简化配置避免卡死
        const gif = new window.GIF({
          workers: 1, // 单线程避免卡顿
          quality: Math.max(1, Math.min(30, options.quality)),
          width: finalWidth,
          height: finalHeight,
          debug: false, // 关闭调试
          repeat: options.repeat || 0,
          transparent: options.transparent,
          background: options.background,
          dither: false, // 关闭抖动
          globalPalette: false, // 关闭全局调色板
          optimise: false // 关闭优化避免卡死
        });

        // 设置超时处理
        const timeout = setTimeout(() => {
          console.error('GIF压缩超时');
          reject(new Error('GIF压缩超时，请尝试减少帧数或降低质量'));
        }, 60000); // 60秒超时

        // 监听完成事件
        gif.on('finished', (blob) => {
          clearTimeout(timeout);
          console.log(`GIF压缩完成: 原始帧数=${gifData.frames.length}, 目标尺寸=${finalWidth}x${finalHeight}, 文件大小=${(blob.size/1024).toFixed(1)}KB`);
          resolve(blob);
        });

        // 监听错误事件
        gif.on('error', (error) => {
          clearTimeout(timeout);
          console.error('GIF压缩错误:', error);
          reject(new Error(`GIF压缩失败: ${error.message || '未知错误'}`));
        });

        // 监听进度事件
        if (options.onProgress) {
          gif.on('progress', (progress) => {
            console.log(`GIF渲染进度: ${Math.round(progress * 100)}%`);
            options.onProgress(progress);
          });
        }

        // 创建渲染器
        const renderer = new GifRenderer(gifData, {
          autoPlay: false,
          scale: 1,
          backgroundColor: 'transparent' // 强制透明背景
        });

        // 添加帧到gif实例
        this.addFramesToGifOptimized(gif, renderer, gifData, finalWidth, finalHeight, options)
          .then(() => {
            console.log('开始GIF渲染...');
            // 开始渲染
            gif.render();
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });

      } catch (error) {
        console.error('创建GIF压缩器失败:', error);
        reject(new Error(`创建GIF压缩器失败: ${error.message}`));
      }
    });
  }
  /**
   * 优化版帧添加方法 - 减少文件大小
   * @param {Object} gif - gif.js实例
   * @param {GifRenderer} renderer - GIF渲染器
   * @param {Object} gifData - GIF数据
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @param {Object} options - 选项
   */  async addFramesToGifOptimized(gif, renderer, gifData, targetWidth, targetHeight, options) {
    const originalWidth = gifData.logicalScreen.width;
    const originalHeight = gifData.logicalScreen.height;
    const needsResize = targetWidth !== originalWidth || targetHeight !== originalHeight;
    
    // 计算帧跳过策略
    const frameStep = this.calculateFrameStep(gifData.frames.length, options);
    const totalFramesToProcess = Math.ceil(gifData.frames.length / frameStep);
    
    console.log(`帧处理策略: 原始${gifData.frames.length}帧, 步长=${frameStep}, 处理${totalFramesToProcess}帧`);

    let processedFrames = 0;
    
    // 简化逐帧压缩：直接处理每一帧，不做复杂的背景合成
    for (let i = 0; i < gifData.frames.length; i += frameStep) {
      const frame = gifData.frames[i];
      
      try {
        // 渲染当前帧到独立画布
        renderer.renderFrame(i);
        
        // 创建压缩用的画布，添加优化属性
        let frameCanvas = document.createElement('canvas');
        let frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
        
        if (needsResize) {
          // 缩放帧
          frameCanvas.width = targetWidth;
          frameCanvas.height = targetHeight;
          frameCtx.imageSmoothingEnabled = true;
          frameCtx.imageSmoothingQuality = 'high';
          frameCtx.drawImage(renderer.canvas, 0, 0, targetWidth, targetHeight);
        } else {
          // 直接复制帧
          frameCanvas.width = originalWidth;
          frameCanvas.height = originalHeight;
          frameCtx.drawImage(renderer.canvas, 0, 0);
        }

        // 计算帧延迟
        let delay = (frame.delayTime || 10) * 10;
        if (frameStep > 1) {
          delay *= frameStep; // 跳帧时调整延迟
        }
        delay = Math.max(20, Math.min(delay, 1000)); // 限制在合理范围

        // 直接添加压缩后的帧
        gif.addFrame(frameCanvas, {
          delay: delay,
          copy: true
        });

        processedFrames++;
        
        // 进度回调
        if (options.onFrameAdded) {
          options.onFrameAdded(processedFrames, totalFramesToProcess);
        }

        // 释放临时画布
        frameCanvas = null;
        frameCtx = null;

      } catch (error) {
        console.warn(`处理帧 ${i} 失败:`, error);
        // 继续处理下一帧
      }
    }
    
    console.log(`实际处理了 ${processedFrames} 帧`);
  }
      }    }
    
    console.log(`实际处理了 ${processedFrames} 帧`);
  }

  /**
   * 优化版画布缩放 - 更好的质量和性能
   * @param {HTMLCanvasElement} sourceCanvas - 源画布
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @returns {HTMLCanvasElement} 缩放后的画布
   */
  resizeCanvasOptimized(sourceCanvas, targetWidth, targetHeight) {
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d');
    
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;
    
    // 优化缩放设置
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'source-over';
    
    // 清除画布并设置透明背景
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    
    // 绘制缩放后的图像
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    return resizedCanvas;
  }

  /**
   * 缩放画布（保持原有方法兼容性）
   */
  resizeCanvas(sourceCanvas, targetWidth, targetHeight) {
    return this.resizeCanvasOptimized(sourceCanvas, targetWidth, targetHeight);
  }

  /**
   * 兜底压缩方案 - 不使用gif.js
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<string>} base64格式的压缩数据
   */
  async compressWithFallback(gifData, options) {
    console.log('使用兜底压缩方案');
      try {
      // 计算目标尺寸
      const targetWidth = options.width || gifData.logicalScreen.width;
      const targetHeight = options.height || gifData.logicalScreen.height;
      const originalWidth = gifData.logicalScreen.width;
      const originalHeight = gifData.logicalScreen.height;

      // 创建渲染器
      const renderer = new GifRenderer(gifData, {
        autoPlay: false,
        scale: 1,
        backgroundColor: options.background || 'transparent'
      });

      // 简单的优化策略
      const optimizedFrames = [];
      const frameStep = this.calculateFrameStep(gifData.frames.length, options);
      
      for (let i = 0; i < gifData.frames.length; i += frameStep) {
        try {
          renderer.renderFrame(i);
          
          let canvas = renderer.canvas;
          
          // 如果需要缩放
          if (targetWidth !== originalWidth || targetHeight !== originalHeight) {
            canvas = this.resizeCanvas(canvas, targetWidth, targetHeight);
          }
          
          // 转换为数据URL
          const dataUrl = canvas.toDataURL('image/png', 0.8);
          const frame = gifData.frames[i];
          
          optimizedFrames.push({
            dataUrl: dataUrl,
            delay: (frame.delayTime || 10) * 10,
            index: i
          });
          
        } catch (error) {
          console.warn(`处理帧 ${i} 失败:`, error);
        }
      }

      // 创建简单的数据包
      const result = {
        type: 'fallback-gif-data',
        width: targetWidth,
        height: targetHeight,
        frames: optimizedFrames,
        originalFrameCount: gifData.frames.length,
        optimizedFrameCount: optimizedFrames.length,
        compressionInfo: {
          method: 'fallback',
          frameReduction: frameStep > 1,
          sizeReduction: targetWidth !== originalWidth || targetHeight !== originalHeight
        }
      };

      console.log(`兜底压缩完成: ${gifData.frames.length} -> ${optimizedFrames.length} 帧`);
      return JSON.stringify(result);

    } catch (error) {
      throw new Error(`兜底压缩失败: ${error.message}`);
    }
  }
  /**
   * 计算帧步长（用于减少帧数） - 优化版
   * @param {number} totalFrames - 总帧数
   * @param {Object} options - 选项
   * @returns {number} 帧步长
   */
  calculateFrameStep(totalFrames, options) {
    // 如果指定了最大帧数
    if (options.maxFrames && totalFrames > options.maxFrames) {
      return Math.ceil(totalFrames / options.maxFrames);
    }
    
    // 根据质量自动计算 - 质量越低，跳帧越多
    if (options.quality >= 25) {
      return Math.min(4, Math.ceil(totalFrames / 15)); // 最多保留15帧
    } else if (options.quality >= 20) {
      return Math.min(3, Math.ceil(totalFrames / 25)); // 最多保留25帧
    } else if (options.quality >= 15) {
      return Math.min(2, Math.ceil(totalFrames / 40)); // 最多保留40帧
    } else if (options.quality >= 10) {
      return Math.max(1, Math.ceil(totalFrames / 60)); // 最多保留60帧
    }
    
    // 高质量模式，保留更多帧
    return 1;
  }

  /**
   * 优化颜色表
   * @param {Array} colorTable - 原始颜色表
   * @param {number} maxColors - 最大颜色数
   * @returns {Array} 优化后的颜色表
   */
  optimizeColorTable(colorTable, maxColors = 256) {
    if (!colorTable || colorTable.length <= maxColors) {
      return colorTable;
    }

    // 简单的颜色量化 - 使用均匀采样
    const step = Math.ceil(colorTable.length / maxColors);
    const optimized = [];
    
    for (let i = 0; i < colorTable.length; i += step) {
      optimized.push(colorTable[i]);
    }

    console.log(`颜色表优化: ${colorTable.length} -> ${optimized.length} 种颜色`);
    return optimized;
  }  /**
   * 估算压缩后的文件大小 - 修正版（基于实际GIF特性）
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @param {number} actualFileSize - 实际原始文件大小（字节）
   * @returns {Object} 大小估算信息
   */
  estimateCompressedSize(gifData, options = {}, actualFileSize = null) {
    const originalWidth = gifData.logicalScreen.width;
    const originalHeight = gifData.logicalScreen.height;
    const targetWidth = options.width || originalWidth;
    const targetHeight = options.height || originalHeight;
    
    // 计算像素数变化
    const pixelRatio = (targetWidth * targetHeight) / (originalWidth * originalHeight);
    
    // 计算帧数变化
    const frameStep = this.calculateFrameStep(gifData.frames.length, options);
    const frameRatio = 1 / frameStep;
    
    // 使用实际文件大小而不是理论估算
    let originalEstimatedSize;
    if (actualFileSize && actualFileSize > 0) {
      originalEstimatedSize = actualFileSize;
    } else {
      // 如果没有实际文件大小，使用更保守的估算
      // GIF的实际压缩比通常比RGB原始数据高很多
      const basePixelSize = originalWidth * originalHeight * 0.5; // 每像素约0.5字节（考虑GIF压缩）
      originalEstimatedSize = basePixelSize * gifData.frames.length;
      
      // 对小文件进行修正
      if (originalEstimatedSize < 10000) { // 小于10KB
        originalEstimatedSize = Math.max(originalEstimatedSize, 5000); // 最小5KB
      }
    }
    
    // 压缩因子计算
    let compressionFactor = 1.0;
    
    // 质量因子 (gif.js的quality值越小压缩越好)
    const qualityFactor = Math.max(0.2, Math.min(1.0, (options.quality || 15) / 30));
    compressionFactor *= qualityFactor;
    
    // 尺寸因子
    compressionFactor *= pixelRatio;
    
    // 帧数因子
    compressionFactor *= frameRatio;
    
    // gif.js压缩效率（相对于已经压缩的GIF）
    if (this.gifJsAvailable) {
      // 对于已经压缩的GIF，再压缩的效果有限
      compressionFactor *= 0.7; // 通常能再压缩30%
    } else {
      compressionFactor *= 0.9; // 兜底方案压缩效果较差
    }
    
    const estimatedSize = Math.round(originalEstimatedSize * compressionFactor);
    
    return {
      originalSize: originalEstimatedSize,
      estimatedSize: estimatedSize,
      reductionRatio: estimatedSize / originalEstimatedSize,
      pixelReduction: 1 - pixelRatio,
      frameReduction: 1 - frameRatio,
      qualityFactor: qualityFactor,
      compressionRatio: 1 - compressionFactor
    };
  }
  /**
   * 创建压缩预览
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @param {number} actualFileSize - 实际原始文件大小（字节）
   * @returns {Object} 预览信息
   */
  createCompressionPreview(gifData, options = {}, actualFileSize = null) {
    const estimation = this.estimateCompressedSize(gifData, options, actualFileSize);
    const frameStep = this.calculateFrameStep(gifData.frames.length, options);
    
    return {
      original: {
        width: gifData.logicalScreen.width,
        height: gifData.logicalScreen.height,
        frameCount: gifData.frames.length,
        estimatedSize: estimation.originalSize,
        actualFileSize: actualFileSize
      },
      compressed: {
        width: options.width || gifData.logicalScreen.width,
        height: options.height || gifData.logicalScreen.height,
        frameCount: Math.ceil(gifData.frames.length / frameStep),
        estimatedSize: estimation.estimatedSize
      },
      reduction: {
        sizeReduction: `${((1 - estimation.reductionRatio) * 100).toFixed(1)}%`,
        pixelReduction: `${(estimation.pixelReduction * 100).toFixed(1)}%`,
        frameReduction: `${(estimation.frameReduction * 100).toFixed(1)}%`
      },
      settings: {
        quality: options.quality || 15,
        method: this.gifJsAvailable ? 'gif.js' : 'fallback',
        frameStep: frameStep
      }
    };
  }

  /**
   * 下载压缩后的GIF
   * @param {Blob|string} compressedData - 压缩后的数据
   * @param {string} filename - 文件名
   */
  downloadCompressedGif(compressedData, filename = 'compressed.gif') {
    try {
      let url;
      
      if (compressedData instanceof Blob) {
        // gif.js生成的Blob
        url = URL.createObjectURL(compressedData);
      } else {
        // 兜底方案的数据，创建JSON文件
        const blob = new Blob([compressedData], { type: 'application/json' });
        url = URL.createObjectURL(blob);
        filename = filename.replace('.gif', '_data.json');
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理URL对象
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log(`文件下载成功: ${filename}`);
      
    } catch (error) {
      console.error('下载失败:', error);
      throw new Error(`下载失败: ${error.message}`);
    }
  }

  /**
   * 批量压缩多个GIF
   * @param {Array} gifDataList - GIF数据数组
   * @param {Object} options - 压缩选项
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array>} 压缩结果数组
   */
  async batchCompress(gifDataList, options = {}, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < gifDataList.length; i++) {
      try {
        const compressed = await this.compressGif(gifDataList[i], options);
        results.push({
          index: i,
          success: true,
          data: compressed,
          error: null
        });
        
        if (onProgress) {
          onProgress(i + 1, gifDataList.length, true);
        }
        
      } catch (error) {
        console.error(`批量压缩第 ${i + 1} 个文件失败:`, error);
        results.push({
          index: i,
          success: false,
          data: null,
          error: error.message
        });
        
        if (onProgress) {
          onProgress(i + 1, gifDataList.length, false);
        }
      }
    }
    
    return results;
  }
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.ImageUtils = ImageUtils;
  window.imageUtils = new ImageUtils();
}

// 导出类（支持CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageUtils;
}
