/**
 * 图像处理工具类 - 专注于GIF压缩和优化
 * 支持gif.js库进行高质量压缩，提供兜底方案
 */
class ImageUtils {
  constructor() {
    this.gifJsAvailable = this.checkGifJsAvailability();
    console.log(
      `ImageUtils初始化: gif.js ${this.gifJsAvailable ? "可用" : "不可用"}`
    );
  }

  /**
   * 检查gif.js库是否可用
   */
  checkGifJsAvailability() {
    return (
      typeof window !== "undefined" &&
      typeof window.GIF !== "undefined" &&
      typeof window.GIF === "function"
    );
  }

  /**
   * 压缩GIF文件 - 主要入口函数
   * @param {Object} gifData - 解析后的GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob|string>} 压缩后的GIF文件或base64数据
   */
  async compressGif(gifData, options = {}) {
    const defaultOptions = {
      width: null, // 目标宽度，null表示保持原始
      height: null, // 目标高度，null表示保持原始
      quality: 10, // 压缩质量 1-30 (数字越低质量越高)
      workers: 2, // 工作线程数
      workerScript: "gif.worker.js", // worker脚本路径
      dither: false, // 是否启用抖动
      debug: false, // 调试模式
      repeat: 0, // 循环次数，0表示无限循环
      transparent: null, // 透明色
      background: null, // 背景色
      maxColors: 256, // 最大颜色数
      ...options,
    };
    if (this.gifJsAvailable) {
      // 根据用户选择决定使用哪种方法
      if (defaultOptions.useDirectPixelMethod === true) {
        // 使用最优化的直接像素处理方法（最接近参考代码的方法）
        try {
          console.log("使用最优化直接像素压缩方法...");
          return await this.compressWithDirectPixels(gifData, defaultOptions);
        } catch (error) {
          console.warn("最优化压缩方法失败，回退到改进方法:", error.message);
          // 回退到改进方法
          defaultOptions.useImprovedMethod = true;
        }
      }

      if (defaultOptions.useImprovedMethod !== false) {
        try {
          console.log("使用改进压缩方法...");
          return await this.compressWithImprovedMethod(gifData, defaultOptions);
        } catch (error) {
          console.warn("改进压缩方法失败，回退到原方法:", error.message);
          return await this.compressWithGifJs(gifData, defaultOptions);
        }
      } else {
        console.log("使用原始压缩方法...");
        return await this.compressWithGifJs(gifData, defaultOptions);
      }
    } else {
      console.warn("gif.js不可用，使用兜底压缩方案");
      return await this.compressWithFallback(gifData, defaultOptions);
    }
  }
  /**
   * 使用gif.js进行压缩
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob>} 压缩后的GIF Blob
   */
  async compressWithGifJs(gifData, options) {
    console.log(gifData);

    return new Promise((resolve, reject) => {
      try {
        // 计算目标尺寸
        const originalWidth = gifData.logicalScreen.width;
        const originalHeight = gifData.logicalScreen.height;
        const targetWidth = options.width || originalWidth;
        const targetHeight = options.height || originalHeight;

        // 计算压缩比例
        const scale = Math.min(
          targetWidth / originalWidth,
          targetHeight / originalHeight
        );
        const finalWidth = Math.round(originalWidth * scale);
        const finalHeight = Math.round(originalHeight * scale);
        console.log(
          `压缩设置: ${originalWidth}x${originalHeight} -> ${finalWidth}x${finalHeight}, 质量=${options.quality}`
        );

        // 创建GIF实例 - 使用更稳定的配置
        const gif = new window.GIF({
          workers: 1, // 单线程更稳定
          quality: Math.max(1, Math.min(20, options.quality)),
          width: finalWidth,
          height: finalHeight,
          debug: false, // 关闭调试减少干扰
          repeat: options.repeat || 0,
          dither: options.dither || false,
          globalPalette: false, // 避免颜色冲突
          optimise: false, // 关闭优化避免卡死
          workerScript: undefined, // 让gif.js自动处理
        }); // 设置超时处理 - 根据帧数动态调整超时时间
        const timeoutDuration = Math.max(15000, gifData.frames.length * 500); // 每帧至少500ms
        const timeout = setTimeout(() => {
          console.error("GIF压缩超时");
          reject(new Error("GIF压缩超时，请尝试减少帧数或降低质量"));
        }, timeoutDuration);

        console.log(
          `设置超时时间: ${timeoutDuration}ms (${gifData.frames.length}帧)`
        );

        // 监听完成事件
        gif.on("finished", (blob) => {
          clearTimeout(timeout);
          console.log(
            `GIF压缩完成: 原始帧数=${
              gifData.frames.length
            }, 目标尺寸=${finalWidth}x${finalHeight}, 文件大小=${(
              blob.size / 1024
            ).toFixed(1)}KB`
          );
          resolve(blob);
        });

        // 监听错误事件
        gif.on("error", (error) => {
          clearTimeout(timeout);
          console.error("GIF压缩错误:", error);
          reject(new Error(`GIF压缩失败: ${error.message || "未知错误"}`));
        }); // 监听进度事件 - 增加更多调试
        if (options.onProgress) {
          gif.on("progress", (progress) => {
            console.log(`GIF渲染进度: ${Math.round(progress * 100)}%`);
            options.onProgress(progress);
          });
        }

        // 监听开始和帧事件
        gif.on("start", () => {
          console.log("GIF开始渲染...");
        });

        gif.on("frame", (frameNumber) => {
          console.log(`gif.js正在处理帧: ${frameNumber}`);
        });

        // 监听中止事件
        gif.on("abort", () => {
          clearTimeout(timeout);
          console.log("GIF渲染被中止");
          reject(new Error("GIF渲染被中止"));
        });

        // 创建渲染器
        const renderer = new GifRenderer(gifData, {
          autoPlay: false,
          scale: 1,
          backgroundColor: "transparent", // 强制透明背景
        }); // 添加帧到gif实例
        this.addFramesToGifOptimized(
          gif,
          renderer,
          gifData,
          finalWidth,
          finalHeight,
          options
        )
          .then(() => {
            console.log("所有帧添加完成，开始GIF渲染...");

            // 添加进度检查
            let lastProgress = 0;
            let progressStuckCount = 0;
            const progressCheckInterval = setInterval(() => {
              // 如果进度卡住了，尝试强制推进
              if (lastProgress === 0 && progressStuckCount > 3) {
                console.warn("检测到渲染可能卡住，尝试强制推进...");
                clearInterval(progressCheckInterval);

                // 取消当前渲染，使用兜底方案
                try {
                  gif.abort();
                } catch (e) {
                  console.warn("无法中止gif.js，继续等待...");
                }
              }
              progressStuckCount++;
            }, 2000);

            // 监听进度更新，重置检查器
            gif.on("progress", (progress) => {
              lastProgress = progress;
              progressStuckCount = 0;
              if (progress > 0) {
                clearInterval(progressCheckInterval);
              }
            });

            // 开始渲染
            gif.render();
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      } catch (error) {
        console.error("创建GIF压缩器失败:", error);
        reject(new Error(`创建GIF压缩器失败: ${error.message}`));
      }
    });
  }

  /**
   * 改进的GIF压缩方法 - 参考成功案例
   * @param {Object} gifData - GIF数据
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob>} 压缩后的GIF文件
   */
  async compressWithImprovedMethod(gifData, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const originalWidth = gifData.logicalScreen.width;
        const originalHeight = gifData.logicalScreen.height;
        const targetWidth = options.width || originalWidth;
        const targetHeight = options.height || originalHeight;

        // 计算缩放比例
        const scale = Math.min(
          targetWidth / originalWidth,
          targetHeight / originalHeight
        );
        const finalWidth = Math.round(originalWidth * scale);
        const finalHeight = Math.round(originalHeight * scale);

        console.log(
          `改进压缩: ${originalWidth}x${originalHeight} -> ${finalWidth}x${finalHeight}, 质量=${options.quality}`
        );

        // 创建GIF实例 - 使用参考代码的配置
        const gif = new window.GIF({
          workers: 2, // 使用2个workers如参考代码
          quality: 10, // 固定质量为10
          width: finalWidth,
          height: finalHeight,
          repeat: options.repeat || 0,
        });

        // 设置超时
        const timeout = setTimeout(() => {
          console.error("GIF压缩超时");
          reject(new Error("GIF压缩超时"));
        }, 30000);

        // 监听完成事件
        gif.on("finished", (blob) => {
          clearTimeout(timeout);
          console.log(
            `GIF压缩完成: 文件大小=${(blob.size / 1024).toFixed(1)}KB`
          );
          resolve(blob);
        });

        // 监听错误事件
        gif.on("error", (error) => {
          clearTimeout(timeout);
          console.error("GIF压缩错误:", error);
          reject(new Error(`GIF压缩失败: ${error.message || "未知错误"}`));
        });

        // 监听进度事件
        if (options.onProgress) {
          gif.on("progress", (progress) => {
            console.log(`GIF渲染进度: ${Math.round(progress * 100)}%`);
            options.onProgress(progress);
          });
        }

        // 创建全尺寸画布 - 参考代码的做法
        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = originalWidth;
        fullCanvas.height = originalHeight;
        const fullCtx = fullCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        // 创建渲染器
        const renderer = new GifRenderer(gifData, {
          autoPlay: false,
          scale: 1,
          backgroundColor: "transparent",
        });

        // 处理每一帧 - 使用参考代码的逻辑
        console.log(`开始处理 ${gifData.frames.length} 帧...`);

        for (let i = 0; i < gifData.frames.length; i++) {
          const frame = gifData.frames[i];

          try {
            // 渲染当前帧
            renderer.renderFrame(i);

            // 清除全尺寸画布并设置透明背景
            fullCtx.clearRect(0, 0, originalWidth, originalHeight);
            fullCtx.fillStyle = "transparent";
            fullCtx.fillRect(0, 0, originalWidth, originalHeight);

            // 将当前帧绘制到全尺寸画布
            fullCtx.drawImage(renderer.canvas, 0, 0);

            // 创建缩放画布
            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = finalWidth;
            scaledCanvas.height = finalHeight;
            const scaledCtx = scaledCanvas.getContext("2d", {
              willReadFrequently: true,
            });

            // 缩放绘制
            scaledCtx.imageSmoothingEnabled = true;
            scaledCtx.imageSmoothingQuality = "high";
            scaledCtx.drawImage(fullCanvas, 0, 0, finalWidth, finalHeight);

            // 计算帧延迟
            const delay = (frame.delayTime || 10) * 10;

            // 添加帧到gif - 使用参考代码的参数
            gif.addFrame(scaledCanvas, {
              delay: Math.max(20, delay),
              dispose: 2, // 使用dispose参数如参考代码
            });

            // 进度回调
            if (options.onFrameAdded) {
              options.onFrameAdded(i + 1, gifData.frames.length);
            }

            console.log(`处理帧 ${i + 1}/${gifData.frames.length}`);
          } catch (error) {
            console.warn(`处理帧 ${i} 失败:`, error);
          }
        }

        console.log("所有帧处理完成，开始渲染...");
        gif.render();
      } catch (error) {
        console.error("压缩失败:", error);
        reject(new Error(`压缩失败: ${error.message}`));
      }
    });
  }

  /**
   * 最优化GIF压缩方法 - 直接获取帧像素并处理
   * @param {Object} gifData - 解析后的GIF数据对象
   * @param {Object} options - 压缩选项
   * @returns {Promise<Blob>} - 压缩后的GIF文件
   */
  async compressWithDirectPixels(gifData, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("使用最优化直接像素压缩方法...");

        // 获取原始尺寸
        const originalWidth = gifData.logicalScreen.width;
        const originalHeight = gifData.logicalScreen.height;

        // 计算目标尺寸
        const targetWidth = options.width || originalWidth;
        const targetHeight = options.height || originalHeight;
        const scale = Math.min(
          targetWidth / originalWidth,
          targetHeight / originalHeight
        );
        const finalWidth = Math.round(originalWidth * scale);
        const finalHeight = Math.round(originalHeight * scale);

        console.log(
          `压缩设置: ${originalWidth}x${originalHeight} -> ${finalWidth}x${finalHeight}`
        );

        // 创建GIF实例
        const gif = new window.GIF({
          workers: 2,
          quality: 10, // 固定质量为10
          width: finalWidth,
          height: finalHeight,
          debug: false,
        });

        // 设置超时处理
        const timeout = setTimeout(() => {
          console.error("GIF压缩超时");
          reject(new Error("GIF压缩超时"));
        }, 60000); // 60秒超时

        // 监听完成事件
        gif.on("finished", (blob) => {
          clearTimeout(timeout);
          console.log(
            `GIF压缩完成: 文件大小=${(blob.size / 1024).toFixed(1)}KB`
          );
          resolve(blob);
        });

        // 监听错误
        gif.on("error", (error) => {
          clearTimeout(timeout);
          console.error("GIF压缩错误:", error);
          reject(new Error(`GIF压缩失败: ${error.message || "未知错误"}`));
        });

        // 监听进度
        if (options.onProgress) {
          gif.on("progress", (progress) => {
            console.log(`GIF渲染进度: ${Math.round(progress * 100)}%`);
            options.onProgress(progress);
          });
        }

        // 创建全尺寸画布
        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = originalWidth;
        fullCanvas.height = originalHeight;
        const fullCtx = fullCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        // 渲染器 - 用于提取像素数据
        const renderer = new GifRenderer(gifData, {
          autoPlay: false,
          scale: 1,
          backgroundColor: "transparent",
        });

        // 处理每一帧 - 类似参考代码的方式
        console.log(`开始处理 ${gifData.frames.length} 帧...`);

        for (let i = 0; i < gifData.frames.length; i++) {
          const frame = gifData.frames[i];

          try {
            // 设置背景为透明
            fullCtx.fillStyle = "transparent";
            fullCtx.clearRect(0, 0, originalWidth, originalHeight);
            fullCtx.fillRect(0, 0, originalWidth, originalHeight);

            // 使用我们的渲染器获取帧数据
            renderer.renderFrame(i);

            // 从渲染器获取帧数据并绘制 - 最直接的方法，避开复杂处理
            fullCtx.drawImage(renderer.canvas, 0, 0);

            // 创建缩放画布
            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = finalWidth;
            scaledCanvas.height = finalHeight;
            const scaledCtx = scaledCanvas.getContext("2d", {
              willReadFrequently: true,
            });

            // 缩放绘制
            scaledCtx.drawImage(fullCanvas, 0, 0, finalWidth, finalHeight);

            // 计算帧延迟
            const delay = (frame.delayTime || 10) * 10; // 与参考代码相同，默认100ms

            // 添加帧到gif - 直接使用dispose:2，确保帧切换正确
            gif.addFrame(scaledCanvas, {
              delay: Math.max(20, delay),
              dispose: 2,
            });

            // 进度回调
            if (options.onFrameAdded) {
              options.onFrameAdded(i + 1, gifData.frames.length);
            }

            console.log(`处理帧 ${i + 1}/${gifData.frames.length}`); // 释放资源（使用更安全的重置方式）
            // 不直接设置为null，因为这些变量不是let

            // 每5帧添加小延迟，避免长时间阻塞UI
            if ((i + 1) % 5 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          } catch (error) {
            console.warn(`处理帧 ${i} 失败:`, error);
          }
        }

        console.log("所有帧处理完成，开始渲染...");
        gif.render();
      } catch (error) {
        console.error("压缩失败:", error);
        reject(new Error(`压缩失败: ${error.message}`));
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
   */ async addFramesToGifOptimized(
    gif,
    renderer,
    gifData,
    targetWidth,
    targetHeight,
    options
  ) {
    const originalWidth = gifData.logicalScreen.width;
    const originalHeight = gifData.logicalScreen.height;
    const needsResize =
      targetWidth !== originalWidth || targetHeight !== originalHeight;

    // 计算帧跳过策略 - 移除最大帧数限制，保持GIF完整性
    const frameStep = this.calculateFrameStep(gifData.frames.length, options);
    const totalFramesToProcess = Math.ceil(gifData.frames.length / frameStep);

    console.log(
      `帧处理策略: 原始${gifData.frames.length}帧, 步长=${frameStep}, 处理${totalFramesToProcess}帧`
    );

    let processedFrames = 0;

    // 简化逐帧压缩：直接处理每一帧，不做复杂的背景合成
    for (let i = 0; i < gifData.frames.length; i += frameStep) {
      const frame = gifData.frames[i];
      console.log(`处理帧 ${i} (总帧数: ${gifData.frames.length})`);

      try {
        console.log(`处理帧 ${i}/${gifData.frames.length}`);

        // 渲染当前帧到独立画布
        renderer.renderFrame(i);

        // 创建压缩用的画布，添加优化属性
        let frameCanvas = document.createElement("canvas");
        let frameCtx = frameCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (needsResize) {
          // 缩放帧
          frameCanvas.width = targetWidth;
          frameCanvas.height = targetHeight;
          frameCtx.imageSmoothingEnabled = true;
          frameCtx.imageSmoothingQuality = "high";
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
        delay = Math.max(20, Math.min(delay, 500)); // 限制在合理范围，降低最大延迟        // 添加帧到gif - 使用canvas但强制复制
        console.log(
          `添加帧 ${
            processedFrames + 1
          }/${totalFramesToProcess}, 延迟: ${delay}ms`
        );

        gif.addFrame(frameCanvas, {
          delay: delay,
          copy: true,
        });

        processedFrames++;

        // 进度回调
        if (options.onFrameAdded) {
          options.onFrameAdded(processedFrames, totalFramesToProcess);
        }

        // 强制垃圾回收
        frameCanvas = null;
        frameCtx = null;

        // 添加小延迟，避免阻塞UI
        if (processedFrames % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      } catch (error) {
        console.warn(`处理帧 ${i} 失败:`, error);
        // 继续处理下一帧
      }
    }

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
    const resizedCanvas = document.createElement("canvas");
    const ctx = resizedCanvas.getContext("2d");

    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    // 优化缩放设置
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalCompositeOperation = "source-over";

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
    console.log("使用兜底压缩方案");
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
        backgroundColor: options.background || "transparent",
      });

      // 简单的优化策略
      const optimizedFrames = [];
      const frameStep = this.calculateFrameStep(gifData.frames.length, options);

      for (let i = 0; i < gifData.frames.length; i += frameStep) {
        try {
          renderer.renderFrame(i);

          let canvas = renderer.canvas;

          // 如果需要缩放
          if (
            targetWidth !== originalWidth ||
            targetHeight !== originalHeight
          ) {
            canvas = this.resizeCanvas(canvas, targetWidth, targetHeight);
          }

          // 转换为数据URL
          const dataUrl = canvas.toDataURL("image/png", 0.8);
          const frame = gifData.frames[i];

          optimizedFrames.push({
            dataUrl: dataUrl,
            delay: (frame.delayTime || 10) * 10,
            index: i,
          });
        } catch (error) {
          console.warn(`处理帧 ${i} 失败:`, error);
        }
      }

      // 创建简单的数据包
      const result = {
        type: "fallback-gif-data",
        width: targetWidth,
        height: targetHeight,
        frames: optimizedFrames,
        originalFrameCount: gifData.frames.length,
        optimizedFrameCount: optimizedFrames.length,
        compressionInfo: {
          method: "fallback",
          frameReduction: frameStep > 1,
          sizeReduction:
            targetWidth !== originalWidth || targetHeight !== originalHeight,
        },
      };

      console.log(
        `兜底压缩完成: ${gifData.frames.length} -> ${optimizedFrames.length} 帧`
      );
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
   */ calculateFrameStep(totalFrames, options) {
    // 如果用户明确指定了最大帧数
    if (options.maxFrames && totalFrames > options.maxFrames) {
      return Math.ceil(totalFrames / options.maxFrames);
    }

    // 如果用户明确指定了帧步长（手动跳帧模式）
    if (options.frameStep && options.frameStep > 1) {
      return options.frameStep;
    }

    // 如果选择了自动跳帧模式，根据质量决定
    if (options.useAutoFrameSkip) {
      if (options.quality >= 25) {
        return Math.min(2, Math.ceil(totalFrames / 100)); // 只有超过100帧才考虑跳1帧
      } else if (options.quality >= 20) {
        return totalFrames > 150 ? 2 : 1; // 超过150帧才跳1帧
      }
    }

    // 默认保持所有帧，确保GIF效果完整
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

    console.log(
      `颜色表优化: ${colorTable.length} -> ${optimized.length} 种颜色`
    );
    return optimized;
  }
  /**
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
    const pixelRatio =
      (targetWidth * targetHeight) / (originalWidth * originalHeight);

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
      if (originalEstimatedSize < 10000) {
        // 小于10KB
        originalEstimatedSize = Math.max(originalEstimatedSize, 5000); // 最小5KB
      }
    }

    // 压缩因子计算
    let compressionFactor = 1.0;

    // 质量因子 (gif.js的quality值越小压缩越好)
    const qualityFactor = Math.max(
      0.2,
      Math.min(1.0, (options.quality || 15) / 30)
    );
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
      compressionRatio: 1 - compressionFactor,
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
    const estimation = this.estimateCompressedSize(
      gifData,
      options,
      actualFileSize
    );
    const frameStep = this.calculateFrameStep(gifData.frames.length, options);

    return {
      original: {
        width: gifData.logicalScreen.width,
        height: gifData.logicalScreen.height,
        frameCount: gifData.frames.length,
        estimatedSize: estimation.originalSize,
        actualFileSize: actualFileSize,
      },
      compressed: {
        width: options.width || gifData.logicalScreen.width,
        height: options.height || gifData.logicalScreen.height,
        frameCount: Math.ceil(gifData.frames.length / frameStep),
        estimatedSize: estimation.estimatedSize,
      },
      reduction: {
        sizeReduction: `${((1 - estimation.reductionRatio) * 100).toFixed(1)}%`,
        pixelReduction: `${(estimation.pixelReduction * 100).toFixed(1)}%`,
        frameReduction: `${(estimation.frameReduction * 100).toFixed(1)}%`,
      },
      settings: {
        quality: options.quality || 15,
        method: this.gifJsAvailable ? "gif.js" : "fallback",
        frameStep: frameStep,
      },
    };
  }

  /**
   * 下载压缩后的GIF
   * @param {Blob|string} compressedData - 压缩后的数据
   * @param {string} filename - 文件名
   */
  downloadCompressedGif(compressedData, filename = "compressed.gif") {
    try {
      let url;

      if (compressedData instanceof Blob) {
        // gif.js生成的Blob
        url = URL.createObjectURL(compressedData);
      } else {
        // 兜底方案的数据，创建JSON文件
        const blob = new Blob([compressedData], { type: "application/json" });
        url = URL.createObjectURL(blob);
        filename = filename.replace(".gif", "_data.json");
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 清理URL对象
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      console.log(`文件下载成功: ${filename}`);
    } catch (error) {
      console.error("下载失败:", error);
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
          error: null,
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
          error: error.message,
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
if (typeof window !== "undefined") {
  window.ImageUtils = ImageUtils;
  window.imageUtils = new ImageUtils();
}

// 导出类（支持CommonJS和ES6模块）
if (typeof module !== "undefined" && module.exports) {
  module.exports = ImageUtils;
}
