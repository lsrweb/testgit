/**
 * GIF压缩工具类
 * 提供简单的GIF压缩功能，不依赖Vue框架
 * 支持文件与base64互转
 */
class GifCompressor {
  constructor() {
    this.isCompressing = false;
    this.progressCallback = null;
    this.middlewares = []; // 存储中间件函数
    
    // 默认配置
    this.config = {
      maxFileSize: 6 * 1024 * 1024, // 6MB，超过此大小触发压缩
      maxWidth: 800, // 超过此宽度时将宽度固定为此值
      forceCompress: false // 是否强制压缩（忽略条件检测）
    };
  }

  /**
   * 设置进度回调函数
   * @param {Function} callback 进度回调函数，接收进度百分比参数
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  /**
   * 更新压缩进度
   * @param {number} progress 进度百分比 (0-100)
   */
  updateProgress(progress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * 将File对象转换为base64字符串
   * @param {File} file 文件对象
   * @returns {Promise<string>} base64字符串
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 将base64字符串转换为Blob对象
   * @param {string} base64 base64字符串
   * @param {string} mimeType MIME类型，默认为image/gif
   * @returns {Blob} Blob对象
   */
  base64ToBlob(base64, mimeType = 'image/gif') {
    // 移除data:url前缀
    const base64Data = base64.split(',')[1] || base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * 将Blob对象转换为File对象
   * @param {Blob} blob Blob对象
   * @param {string} filename 文件名
   * @returns {File} File对象
   */
  blobToFile(blob, filename) {
    return new File([blob], filename, { type: blob.type });
  }
  /**
   * 压缩GIF文件（智能版本 - 根据配置自动判断是否需要压缩）
   * @param {File|Blob} file GIF文件
   * @param {Object} options 压缩选项
   * @param {number} options.quality 压缩质量 (1-20)，默认5
   * @param {number} options.scale 缩放比例 (0.1-1.0)，如果不指定会根据检测结果自动设置
   * @param {boolean} options.forceCompress 强制压缩，忽略条件检测
   * @returns {Promise<Object>} 压缩结果对象
   */
  async compressGif(file, options = {}) {
    if (this.isCompressing) {
      throw new Error('正在压缩中，请等待当前任务完成');
    }

    this.isCompressing = true;
    this.updateProgress(0);

    try {
      // 获取GIF基本信息
      const gifInfo = await this.getGifInfo(file);
      this.updateProgress(5);

      // 执行中间件
      const middlewareResult = await this.executeMiddlewares(file, gifInfo);
      if (!middlewareResult.shouldProcess) {
        this.isCompressing = false;
        return {
          blob: file,
          base64: await this.fileToBase64(file),
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          downloadUrl: URL.createObjectURL(file),
          processed: false,
          reason: '中间件阻止了处理'
        };
      }
      this.updateProgress(10);

      // 检查是否需要压缩
      const compressionCheck = this.checkCompressionNeeded(middlewareResult.file, middlewareResult.info);
      
      // 如果不需要压缩且没有强制压缩选项，直接返回原文件
      if (!compressionCheck.needed && !options.forceCompress) {
        this.isCompressing = false;
        this.updateProgress(100);
        return {
          blob: file,
          base64: await this.fileToBase64(file),
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          downloadUrl: URL.createObjectURL(file),
          processed: false,
          reason: compressionCheck.reason
        };
      }

      // 确定压缩参数
      const config = {
        quality: options.quality || 5,
        scale: options.scale || compressionCheck.suggestedScale || 0.7
      };

      console.log('开始压缩:', {
        reason: compressionCheck.reason,
        config,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        dimensions: `${gifInfo.width}×${gifInfo.height}`
      });      // 执行实际压缩
      const compressResult = await this.performCompression(middlewareResult.file, config);
      
      // 检查压缩效果，防止反向压缩
      const shouldUseCompressed = this.shouldUseCompressedResult(
        file.size, 
        compressResult.compressedSize, 
        config
      );
      
      this.isCompressing = false;
      this.updateProgress(100);

      if (!shouldUseCompressed) {
        // 压缩效果不佳，返回原文件
        console.log('压缩效果不佳，使用原文件');
        return {
          blob: file,
          base64: await this.fileToBase64(file),
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          downloadUrl: URL.createObjectURL(file),
          processed: false,
          reason: '压缩后文件更大或效果不明显，已自动使用原文件',
          originalDimensions: `${gifInfo.width}×${gifInfo.height}`,
          newDimensions: `${gifInfo.width}×${gifInfo.height}`,
          compressionAttempted: true
        };
      }

      return {
        ...compressResult,
        processed: true,
        reason: compressionCheck.reason,
        originalDimensions: `${gifInfo.width}×${gifInfo.height}`,
        newDimensions: `${Math.round(gifInfo.width * config.scale)}×${Math.round(gifInfo.height * config.scale)}`
      };

    } catch (error) {
      this.isCompressing = false;
      throw error;
    }
  }
  /**
   * 执行实际的GIF压缩操作
   * @param {File|Blob} file GIF文件
   * @param {Object} config 压缩配置
   * @returns {Promise<Object>} 压缩结果
   */
  async performCompression(file, config) {
    // 优化压缩配置
    const finalConfig = {
      quality: this.optimizeQuality(config.quality || 5, file.size),
      scale: config.scale || 0.7
    };

    console.log('使用优化后的配置:', finalConfig);

    try {
      // 读取文件为ArrayBuffer
      const buffer = await this.fileToArrayBuffer(file);
      this.updateProgress(20);

      // 检查文件是否为有效的GIF
      if (!this.isValidGif(buffer)) {
        throw new Error('不是有效的GIF文件');
      }

      // 解析GIF数据
      const gifData = gifuctJs.parseGIF(buffer);
      const frames = gifuctJs.decompressFrames(gifData, true);
      this.updateProgress(30);

      if (!frames.length) {
        throw new Error('无法解析GIF帧');
      }

      // 获取GIF尺寸
      const gifWidth = frames[0].dims.width;
      const gifHeight = frames[0].dims.height;
      const newWidth = Math.round(gifWidth * finalConfig.scale);
      const newHeight = Math.round(gifHeight * finalConfig.scale);

      // 如果缩放后尺寸与原始尺寸相同，且文件不大，可能不需要压缩
      if (newWidth >= gifWidth * 0.95 && newHeight >= gifHeight * 0.95 && file.size < 2 * 1024 * 1024) {
        console.log('尺寸变化不大且文件较小，可能不需要压缩');
      }

      // 优化GIF编码器设置
      const gifOptions = this.getOptimizedGifOptions(finalConfig, newWidth, newHeight, frames.length);
      const gif = new GIF(gifOptions);

      // 创建主画布用于累积帧
      const accumCanvas = document.createElement('canvas');
      accumCanvas.width = gifWidth;
      accumCanvas.height = gifHeight;
      const accumCtx = accumCanvas.getContext('2d');
      
      // 设置背景为透明
      accumCtx.fillStyle = 'rgba(0, 0, 0, 0)';
      accumCtx.fillRect(0, 0, gifWidth, gifHeight);

      // 优化帧处理 - 跳过重复帧以减少文件大小
      const processedFrames = this.optimizeFrames(frames);
      
      // 处理每一帧
      for (let i = 0; i < processedFrames.length; i++) {
        const frame = processedFrames[i];
        
        // 根据disposal方法处理帧
        if (i > 0) {
          const prevFrame = processedFrames[i - 1];
          if (prevFrame.disposalType === 2) {
            // 恢复到背景色
            accumCtx.clearRect(0, 0, gifWidth, gifHeight);
            accumCtx.fillStyle = 'rgba(0, 0, 0, 0)';
            accumCtx.fillRect(0, 0, gifWidth, gifHeight);
          } else if (prevFrame.disposalType === 3) {
            // 恢复到上一帧（这里简化处理）
            // 实际情况下需要保存前一帧状态
          }
          // disposalType === 1 或 0：不处理，保持当前画布状态
        }
        
        // 创建当前帧的画布
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = frame.dims.width;
        frameCanvas.height = frame.dims.height;
        const frameCtx = frameCanvas.getContext('2d');
        
        // 创建图像数据
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height
        );

        frameCtx.putImageData(imageData, 0, 0);
        
        // 将当前帧绘制到累积画布上
        accumCtx.drawImage(frameCanvas, frame.dims.left, frame.dims.top);

        // 创建缩放后的画布
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = newWidth;
        scaledCanvas.height = newHeight;
        const scaledCtx = scaledCanvas.getContext('2d');
        
        // 设置高质量的图像渲染
        scaledCtx.imageSmoothingEnabled = true;
        scaledCtx.imageSmoothingQuality = 'high';
        
        // 清空缩放画布
        scaledCtx.clearRect(0, 0, newWidth, newHeight);
        
        // 绘制缩放后的图像
        scaledCtx.drawImage(accumCanvas, 0, 0, newWidth, newHeight);

        // 添加帧到GIF
        gif.addFrame(scaledCanvas, {
          delay: frame.delay || 100,
          dispose: frame.disposalType || 1
        });

        // 更新进度
        this.updateProgress(30 + (i / processedFrames.length) * 40);
      }

      // 渲染GIF
      const result = await this.renderGif(gif);
      this.updateProgress(90);

      // 计算压缩信息
      const originalSize = file.size;
      const compressedSize = result.blob.size;
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

      return {
        blob: result.blob,
        base64: result.base64,
        originalSize,
        compressedSize,
        compressionRatio,
        downloadUrl: result.downloadUrl
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据文件大小优化质量参数
   * @param {number} quality 原始质量值
   * @param {number} fileSize 文件大小
   * @returns {number} 优化后的质量值
   */
  optimizeQuality(quality, fileSize) {
    // 对于小文件（<1MB），使用较高质量避免过度压缩
    if (fileSize < 1024 * 1024) {
      return Math.max(quality, 3);
    }
    
    // 对于中等文件（1-5MB），使用中等质量
    if (fileSize < 5 * 1024 * 1024) {
      return Math.max(quality, 5);
    }
    
    // 对于大文件（>5MB），可以使用较低质量
    return Math.max(quality, 8);
  }

  /**
   * 获取优化的GIF编码器选项
   * @param {Object} config 压缩配置
   * @param {number} width 新宽度
   * @param {number} height 新高度
   * @param {number} frameCount 帧数
   * @returns {Object} GIF编码器选项
   */
  getOptimizedGifOptions(config, width, height, frameCount) {
    return {
      workers: Math.min(4, Math.max(1, Math.floor(frameCount / 50))), // 根据帧数调整worker数量
      quality: config.quality,
      width: width,
      height: height,
      dither: false, // 关闭抖动以减少点状效果
      transparent: null, // 保持透明度
      repeat: 0, // 循环播放
      workerScript: './gif/gif.worker.js'
    };
  }

  /**
   * 优化帧序列（移除重复帧等）
   * @param {Array} frames 原始帧数组
   * @returns {Array} 优化后的帧数组
   */
  optimizeFrames(frames) {
    // 简单的帧优化：如果连续帧相同，可以合并（这里暂时返回原数组）
    // 未来可以添加更复杂的帧优化逻辑
    return frames;
  }

  /**
   * 将文件转换为ArrayBuffer
   * @param {File|Blob} file 文件对象
   * @returns {Promise<ArrayBuffer>} ArrayBuffer
   */
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 检查是否为有效的GIF文件
   * @param {ArrayBuffer} buffer 文件缓冲区
   * @returns {boolean} 是否为有效GIF
   */
  isValidGif(buffer) {
    const view = new Uint8Array(buffer);
    // 检查GIF文件头
    return view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46; // "GIF"
  }

  /**
   * 渲染GIF并返回结果
   * @param {GIF} gif GIF编码器实例
   * @returns {Promise<Object>} 渲染结果
   */
  renderGif(gif) {
    return new Promise((resolve, reject) => {
      gif.on('finished', (blob) => {
        // 转换为base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result;
          const downloadUrl = URL.createObjectURL(blob);
          
          resolve({
            blob,
            base64,
            downloadUrl
          });
        };
        reader.onerror = () => reject(new Error('Blob转换为base64失败'));
        reader.readAsDataURL(blob);
      });

      gif.on('abort', () => {
        reject(new Error('GIF渲染被中止'));
      });

      gif.on('progress', (progress) => {
        this.updateProgress(70 + progress * 25);
      });

      // 开始渲染
      gif.render();
    });
  }

  /**
   * 创建下载链接并自动下载文件
   * @param {Blob} blob 文件Blob对象
   * @param {string} filename 下载文件名
   */
  downloadBlob(blob, filename = 'compressed.gif') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 批量压缩GIF文件
   * @param {Array<File>} files 文件数组
   * @param {Object} options 压缩选项
   * @returns {Promise<Array>} 压缩结果数组
   */
  async batchCompress(files, options = {}) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.compressGif(files[i], options);
        results.push({
          index: i,
          filename: files[i].name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          index: i,
          filename: files[i].name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 获取GIF基本信息
   * @param {File|Blob} file GIF文件
   * @returns {Promise<Object>} GIF信息
   */
  async getGifInfo(file) {
    try {
      const buffer = await this.fileToArrayBuffer(file);
      
      if (!this.isValidGif(buffer)) {
        throw new Error('不是有效的GIF文件');
      }

      const gifData = gifuctJs.parseGIF(buffer);
      const frames = gifuctJs.decompressFrames(gifData, true);

      if (!frames.length) {
        throw new Error('无法解析GIF帧');
      }

      const width = frames[0].dims.width;
      const height = frames[0].dims.height;
      const frameCount = frames.length;
      
      // 计算总时长
      const totalDuration = frames.reduce((sum, frame) => sum + (frame.delay || 100), 0);

      return {
        width,
        height,
        frameCount,
        fileSize: file.size,
        duration: totalDuration, // 毫秒
        fps: Math.round(1000 / (totalDuration / frameCount))
      };
    } catch (error) {
      throw new Error(`获取GIF信息失败: ${error.message}`);
    }
  }

  /**
   * 更新配置
   * @param {Object} newConfig 新的配置选项
   * @param {number} newConfig.maxFileSize 触发压缩的最大文件大小（字节），默认6MB
   * @param {number} newConfig.maxWidth 触发宽度压缩的最大宽度（像素），默认800px
   * @param {boolean} newConfig.forceCompress 是否强制压缩，默认false
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   * @returns {Object} 当前配置对象
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 添加中间件函数
   * @param {Function} middleware 中间件函数，接收(file, info)参数，返回处理结果
   */
  addMiddleware(middleware) {
    if (typeof middleware === 'function') {
      this.middlewares.push(middleware);
    } else {
      throw new Error('中间件必须是一个函数');
    }
  }

  /**
   * 移除所有中间件
   */
  clearMiddlewares() {
    this.middlewares = [];
  }

  /**
   * 执行中间件链
   * @param {File|Blob} file 文件对象
   * @param {Object} info 文件信息
   * @returns {Promise<Object>} 中间件处理结果
   */
  async executeMiddlewares(file, info) {
    let result = { shouldProcess: true, file, info };
    
    for (const middleware of this.middlewares) {
      try {
        const middlewareResult = await middleware(result.file, result.info);
        if (middlewareResult && typeof middlewareResult === 'object') {
          result = { ...result, ...middlewareResult };
        }
        
        // 如果中间件返回 shouldProcess: false，停止处理
        if (result.shouldProcess === false) {
          break;
        }
      } catch (error) {
        console.error('中间件执行错误:', error);
        throw new Error(`中间件执行失败: ${error.message}`);
      }
    }
    
    return result;
  }
  /**
   * 检查文件是否需要压缩
   * @param {File|Blob} file 文件对象
   * @param {Object} gifInfo GIF信息对象
   * @returns {Object} 检查结果
   */
  checkCompressionNeeded(file, gifInfo) {
    // 如果强制压缩，直接返回需要压缩
    if (this.config.forceCompress) {
      return {
        needed: true,
        reason: '强制压缩模式',
        suggestedScale: 0.7,
        suggestedWidth: null
      };
    }

    const fileSize = file.size;
    const width = gifInfo.width;
    const results = {
      needed: false,
      reason: '',
      suggestedScale: 1.0,
      suggestedWidth: null
    };

    // 检查文件大小
    if (fileSize > this.config.maxFileSize) {
      results.needed = true;
      results.reason = `文件大小 ${(fileSize / 1024 / 1024).toFixed(2)}MB 超过限制 ${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB`;
      results.suggestedScale = 0.7; // 大文件建议较大压缩
      return results;
    }

    // 检查图片宽度
    if (width > this.config.maxWidth) {
      results.needed = true;
      results.reason = `图片宽度 ${width}px 超过限制 ${this.config.maxWidth}px`;
      results.suggestedScale = this.config.maxWidth / width; // 按比例缩放到目标宽度
      results.suggestedWidth = this.config.maxWidth;
      return results;
    }

    results.reason = '文件满足条件，无需压缩';
    return results;
  }
  /**
   * 检查压缩结果是否有效（防止反向压缩）
   * @param {number} originalSize 原始文件大小
   * @param {number} compressedSize 压缩后文件大小
   * @param {Object} config 压缩配置
   * @param {Object} gifInfo GIF信息（可选）
   * @returns {Object} 压缩结果评估
   */
  shouldUseCompressedResult(originalSize, compressedSize, config, gifInfo = null) {
    const compressionRatio = (originalSize - compressedSize) / originalSize;
    const sizeReduction = originalSize - compressedSize;
    
    // 计算文件大小分类
    const originalSizeMB = originalSize / (1024 * 1024);
    const compressedSizeMB = compressedSize / (1024 * 1024);
    
    console.log('压缩效果分析:', {
      originalSize: `${originalSizeMB.toFixed(2)}MB`,
      compressedSize: `${compressedSizeMB.toFixed(2)}MB`,
      compressionRatio: `${(compressionRatio * 100).toFixed(2)}%`,
      sizeReduction: `${(sizeReduction / 1024).toFixed(2)}KB`,
      scale: config.scale,
      quality: config.quality
    });

    // 情况1：压缩后文件更大（典型的反向压缩）
    if (compressedSize >= originalSize) {
      return {
        shouldUse: false,
        reason: '压缩后文件更大，存在反向压缩',
        details: `原始: ${originalSizeMB.toFixed(2)}MB → 压缩后: ${compressedSizeMB.toFixed(2)}MB`
      };
    }
    
    // 情况2：轻微增大（在误差范围内，但仍然不理想）
    if (compressionRatio < 0.02) { // 压缩率小于2%
      if (originalSizeMB < 1.0) { // 小文件
        return {
          shouldUse: false,
          reason: '小文件压缩效果极低，保留原文件',
          details: `仅减少 ${(sizeReduction / 1024).toFixed(2)}KB，效果不明显`
        };
      }
    }
    
    // 情况3：检查是否为无效压缩（质量损失大但大小减少少）
    if (compressionRatio < 0.05 && config.scale > 0.9) {
      return {
        shouldUse: false,
        reason: '高比例缩放但压缩率极低，可能质量损失大于收益',
        details: `缩放比例 ${(config.scale * 100).toFixed(0)}%，但压缩率仅 ${(compressionRatio * 100).toFixed(2)}%`
      };
    }
    
    // 情况4：过度压缩检测（质量参数过低导致的问题）
    if (config.quality > 15 && compressionRatio < 0.1) {
      return {
        shouldUse: false,
        reason: '高质量设置但压缩率低，可能存在编码问题',
        details: `质量设置 ${config.quality}，但压缩率仅 ${(compressionRatio * 100).toFixed(2)}%`
      };
    }
    
    // 情况5：特殊的GIF类型检测（如果有GIF信息）
    if (gifInfo) {
      const pixelCount = gifInfo.width * gifInfo.height * gifInfo.frameCount;
      const bytesPerPixel = originalSize / pixelCount;
      
      // 如果原始文件已经很高效（每像素字节数很低），压缩可能无效
      if (bytesPerPixel < 0.5 && compressionRatio < 0.1) {
        return {
          shouldUse: false,
          reason: '原始文件已经高度优化，无需进一步压缩',
          details: `每像素仅 ${bytesPerPixel.toFixed(3)} 字节，已经很高效`
        };
      }
    }
    
    // 情况6：最小有效压缩阈值
    const minEffectiveReduction = Math.max(50 * 1024, originalSize * 0.03); // 至少减少50KB或3%
    if (sizeReduction < minEffectiveReduction && originalSizeMB > 0.5) {
      return {
        shouldUse: false,
        reason: '压缩效果不足以证明质量损失的合理性',
        details: `仅减少 ${(sizeReduction / 1024).toFixed(2)}KB，低于最小有效阈值`
      };
    }
    
    // 通过所有检测，使用压缩结果
    return {
      shouldUse: true,
      reason: '压缩效果良好',
      details: `成功减少 ${(compressionRatio * 100).toFixed(2)}% (${(sizeReduction / 1024).toFixed(2)}KB)`
    };
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = GifCompressor;
} else if (typeof window !== 'undefined') {
  // 浏览器环境
  window.GifCompressor = GifCompressor;
}
