// GIF解析器核心类 - 改进版
class GifParser {
  constructor(arrayBuffer, options = {}) {
    this.view = new DataView(arrayBuffer);
    this.offset = 0;
    this.frames = [];
    this.globalColorTable = [];
    this.header = {};
    this.logicalScreen = {};
    this.options = {
      strict: false, // 严格模式，遇到错误时抛出异常
      validateFrames: true, // 验证帧数据
      maxFrames: 1000, // 最大帧数限制
      ...options,
    };
    this.errors = [];
    this.warnings = [];
  }

  // 解析GIF头部信息
  parseHeader() {
    // GIF签名和版本 (GIF87a 或 GIF89a)
    const signature = this.readString(3);
    const version = this.readString(3);

    if (signature !== "GIF") {
      throw new Error("无效的GIF文件");
    }

    this.header = { signature, version };
    return this.header;
  }

  // 解析逻辑屏幕描述符
  parseLogicalScreenDescriptor() {
    const width = this.readUint16();
    const height = this.readUint16();

    const packedField = this.readUint8();
    const hasGlobalColorTable = (packedField & 0x80) !== 0;
    const colorResolution = ((packedField & 0x70) >> 4) + 1;
    const isSorted = (packedField & 0x08) !== 0;
    const globalColorTableSize = hasGlobalColorTable
      ? 2 << (packedField & 0x07)
      : 0;

    const backgroundColorIndex = this.readUint8();
    const pixelAspectRatio = this.readUint8();

    this.logicalScreen = {
      width,
      height,
      hasGlobalColorTable,
      colorResolution,
      isSorted,
      globalColorTableSize,
      backgroundColorIndex,
      pixelAspectRatio,
    };

    return this.logicalScreen;
  }

  // 解析全局颜色表
  parseGlobalColorTable() {
    if (this.logicalScreen.hasGlobalColorTable) {
      const size = this.logicalScreen.globalColorTableSize;
      this.globalColorTable = this.readColorTable(size);
    }
    return this.globalColorTable;
  }
  // 解析GIF图像数据块
  parseImageData() {
    let frame = {};

    // 图像描述符
    const introducer = this.readUint8(); // 0x2C 表示图像描述符

    if (introducer !== 0x2c) {
      throw new Error("无效的图像块");
    }

    // 读取位置和尺寸
    frame.left = this.readUint16();
    frame.top = this.readUint16();
    frame.width = this.readUint16();
    frame.height = this.readUint16();

    // 读取包装字段
    const packedField = this.readUint8();
    const hasLocalColorTable = (packedField & 0x80) !== 0;
    frame.isInterlaced = (packedField & 0x40) !== 0;
    frame.isSorted = (packedField & 0x20) !== 0;
    const localColorTableSize = hasLocalColorTable
      ? 2 << (packedField & 0x07)
      : 0;

    // 读取本地颜色表
    if (hasLocalColorTable) {
      frame.colorTable = this.readColorTable(localColorTableSize);
    } else {
      frame.colorTable = this.globalColorTable;
    }

    // 读取LZW最小码长度
    frame.lzwMinCodeSize = this.readUint8();

    // 读取图像数据子块
    let imageData = new Uint8Array();
    let subBlock;

    do {
      subBlock = this.readSubBlock();
      if (subBlock.length > 0) {
        // 合并子块数据
        const newImageData = new Uint8Array(imageData.length + subBlock.length);
        newImageData.set(imageData);
        newImageData.set(subBlock, imageData.length);
        imageData = newImageData;
      }
    } while (subBlock.length > 0);

    frame.imageData = imageData;

    // 如果之前解析了图形控制扩展，将其信息添加到帧中
    if (this.graphicControlExtension) {
      frame.disposalMethod = this.graphicControlExtension.disposalMethod;
      frame.userInputFlag = this.graphicControlExtension.userInputFlag;
      frame.transparentColorFlag =
        this.graphicControlExtension.transparentColorFlag;
      frame.delayTime = this.graphicControlExtension.delayTime;
      frame.transparentColorIndex =
        this.graphicControlExtension.transparentColorIndex;

      // 重置图形控制扩展
      this.graphicControlExtension = null;
    } else {
      // 设置默认值
      frame.disposalMethod = 0;
      frame.userInputFlag = false;
      frame.transparentColorFlag = false;
      frame.delayTime = 0;
      frame.transparentColorIndex = 0;
    }

    // 验证帧数据的完整性
    if (
      !frame.width ||
      !frame.height ||
      frame.width <= 0 ||
      frame.height <= 0
    ) {
      this.addWarning(`帧尺寸无效: ${frame.width}x${frame.height}，跳过此帧`);
      return null;
    }

    if (!frame.imageData || frame.imageData.length === 0) {
      this.addWarning(`帧缺少图像数据，跳过此帧`);
      return null;
    }

    if (!frame.colorTable || frame.colorTable.length === 0) {
      this.addWarning(`帧缺少颜色表，使用全局颜色表`);
      frame.colorTable = this.globalColorTable || [];
    }

    this.frames.push(frame);
    return frame;
  }
  // 解析图形控制扩展
  parseGraphicControlExtension() {
    const blockSize = this.readUint8(); // 应该是4
    if (blockSize !== 4) {
      throw new Error("无效的图形控制扩展块大小");
    }

    const packedField = this.readUint8();
    const disposalMethod = (packedField & 0x1c) >> 2;
    const userInputFlag = (packedField & 0x02) !== 0;
    const transparentColorFlag = (packedField & 0x01) !== 0;

    const delayTime = this.readUint16(); // 1/100秒为单位
    const transparentColorIndex = this.readUint8();
    const blockTerminator = this.readUint8(); // 应该是0

    if (blockTerminator !== 0) {
      throw new Error("图形控制扩展块终结符错误");
    }

    // 将扩展信息保存以供下一帧使用
    this.graphicControlExtension = {
      disposalMethod,
      userInputFlag,
      transparentColorFlag,
      delayTime,
      transparentColorIndex,
    };

    return this.graphicControlExtension;
  }

  // 解析应用程序扩展
  parseApplicationExtension() {
    const blockSize = this.readUint8(); // 应该是11
    if (blockSize !== 11) {
      throw new Error("无效的应用程序扩展块大小");
    }

    const applicationIdentifier = this.readString(8);
    const applicationAuthCode = this.readString(3);

    let applicationData = new Uint8Array();
    let subBlock;

    do {
      subBlock = this.readSubBlock();
      if (subBlock.length > 0) {
        const newData = new Uint8Array(
          applicationData.length + subBlock.length
        );
        newData.set(applicationData);
        newData.set(subBlock, applicationData.length);
        applicationData = newData;
      }
    } while (subBlock.length > 0);

    // 检查是否为NETSCAPE循环扩展
    if (applicationIdentifier === "NETSCAPE" && applicationAuthCode === "2.0") {
      if (applicationData.length >= 3 && applicationData[0] === 1) {
        this.loopCount = applicationData[1] | (applicationData[2] << 8);
      }
    }

    return {
      applicationIdentifier,
      applicationAuthCode,
      applicationData,
      loopCount: this.loopCount,
    };
  }

  // 解析注释扩展
  parseCommentExtension() {
    let commentData = "";
    let subBlock;

    do {
      subBlock = this.readSubBlock();
      if (subBlock.length > 0) {
        for (let i = 0; i < subBlock.length; i++) {
          commentData += String.fromCharCode(subBlock[i]);
        }
      }
    } while (subBlock.length > 0);

    return { comment: commentData };
  }

  // 解析纯文本扩展
  parsePlainTextExtension() {
    const blockSize = this.readUint8(); // 应该是12
    if (blockSize !== 12) {
      throw new Error("无效的纯文本扩展块大小");
    }

    const textGridLeftPosition = this.readUint16();
    const textGridTopPosition = this.readUint16();
    const textGridWidth = this.readUint16();
    const textGridHeight = this.readUint16();
    const characterCellWidth = this.readUint8();
    const characterCellHeight = this.readUint8();
    const textForegroundColorIndex = this.readUint8();
    const textBackgroundColorIndex = this.readUint8();

    let plainTextData = "";
    let subBlock;

    do {
      subBlock = this.readSubBlock();
      if (subBlock.length > 0) {
        for (let i = 0; i < subBlock.length; i++) {
          plainTextData += String.fromCharCode(subBlock[i]);
        }
      }
    } while (subBlock.length > 0);

    return {
      textGridLeftPosition,
      textGridTopPosition,
      textGridWidth,
      textGridHeight,
      characterCellWidth,
      characterCellHeight,
      textForegroundColorIndex,
      textBackgroundColorIndex,
      plainTextData,
    };
  }

  // 跳过未知扩展
  skipExtension() {
    let subBlock;
    do {
      subBlock = this.readSubBlock();
    } while (subBlock.length > 0);
  }

  // 解析GIF扩展块
  parseExtension() {
    const extensionIntroducer = this.readUint8(); // 应该是0x21
    const extensionLabel = this.readUint8();

    if (extensionIntroducer !== 0x21) {
      throw new Error("无效的扩展块");
    }

    // 图形控制扩展 - 包含帧延迟等信息
    if (extensionLabel === 0xf9) {
      return this.parseGraphicControlExtension();
    }

    // 应用程序扩展 - 包含循环信息等
    if (extensionLabel === 0xff) {
      return this.parseApplicationExtension();
    }

    // 注释扩展
    if (extensionLabel === 0xfe) {
      return this.parseCommentExtension();
    }

    // 纯文本扩展
    if (extensionLabel === 0x01) {
      return this.parsePlainTextExtension();
    }

    // 跳过未知扩展
    this.skipExtension();
  }

  // 边界检查的读取方法
  readUint8() {
    if (this.offset >= this.view.byteLength) {
      throw new Error("尝试读取超出文件末尾的数据");
    }
    return this.view.getUint8(this.offset++);
  }

  readUint16() {
    if (this.offset + 1 >= this.view.byteLength) {
      throw new Error("尝试读取超出文件末尾的数据");
    }
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readString(length) {
    if (this.offset + length > this.view.byteLength) {
      throw new Error("尝试读取超出文件末尾的字符串");
    }
    let result = "";
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(this.readUint8());
    }
    return result;
  }

  readColorTable(size) {
    if (size <= 0) {
      return [];
    }

    const colorTable = [];
    for (let i = 0; i < size; i++) {
      const r = this.readUint8();
      const g = this.readUint8();
      const b = this.readUint8();
      colorTable.push({ r, g, b });
    }
    return colorTable;
  }

  readSubBlock() {
    const blockSize = this.readUint8();
    if (blockSize === 0) {
      return new Uint8Array(0);
    }

    if (this.offset + blockSize > this.view.byteLength) {
      throw new Error("子块大小超出文件边界");
    }

    const data = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i++) {
      data[i] = this.readUint8();
    }
    return data;
  }

  // 检查文件完整性
  checkFileIntegrity() {
    // 检查最小文件大小
    if (this.view.byteLength < 13) {
      // GIF头部最小大小
      throw new Error("文件太小，不是有效的GIF文件");
    }

    // 检查文件签名
    const signature = String.fromCharCode(
      this.view.getUint8(0),
      this.view.getUint8(1),
      this.view.getUint8(2)
    );

    if (signature !== "GIF") {
      throw new Error("文件签名无效，不是GIF文件");
    }

    // 检查是否有终结符
    let hasTerminator = false;
    for (let i = this.view.byteLength - 10; i < this.view.byteLength; i++) {
      if (this.view.getUint8(i) === 0x3b) {
        hasTerminator = true;
        break;
      }
    }

    if (!hasTerminator) {
      this.addWarning("GIF文件可能不完整，未找到终结符");
    }
  }

  // 获取剩余字节数
  getBytesRemaining() {
    return this.view.byteLength - this.offset;
  }

  // 跳转到指定位置
  seek(position) {
    if (position < 0 || position >= this.view.byteLength) {
      throw new Error("跳转位置超出文件范围");
    }
    this.offset = position;
  }

  // 获取当前位置
  tell() {
    return this.offset;
  }

  // 静态方法：从文件创建解析器
  static async fromFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parser = new GifParser(event.target.result, options);
          resolve(parser);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsArrayBuffer(file);
    });
  }

  // 静态方法：从URL创建解析器
  static async fromUrl(url, options = {}) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const parser = new GifParser(arrayBuffer, options);
      return parser;
    } catch (error) {
      throw new Error(`从URL加载GIF失败: ${error.message}`);
    }
  }

  // 静态方法：检查是否为GIF文件
  static isGifFile(arrayBuffer) {
    if (arrayBuffer.byteLength < 6) {
      return false;
    }

    const view = new DataView(arrayBuffer);
    const signature = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2)
    );

    return signature === "GIF";
  }

  // 解析整个GIF文件（改进版本）
  parse() {
    try {
      // 预检查文件完整性
      this.checkFileIntegrity();

      this.parseHeader();
      this.parseLogicalScreenDescriptor();
      this.parseGlobalColorTable();

      // 初始化解析状态
      this.loopCount = 1; // 默认循环一次
      this.graphicControlExtension = null;

      // 循环处理块直到遇到终结器
      while (this.offset < this.view.byteLength) {
        // 检查帧数限制
        if (this.frames.length >= this.options.maxFrames) {
          this.addWarning(
            `已达到最大帧数限制 (${this.options.maxFrames})，停止解析`
          );
          break;
        }

        const blockType = this.view.getUint8(this.offset);

        // 终结器
        if (blockType === 0x3b) {
          this.offset++; // 跳过终结符
          break;
        }

        // 扩展块
        if (blockType === 0x21) {
          try {
            this.parseExtension();
          } catch (error) {
            this.handleError(`解析扩展块失败: ${error.message}`);
          }
          continue;
        }

        // 图像描述符
        if (blockType === 0x2c) {
          try {
            this.parseImageData();
          } catch (error) {
            this.handleError(`解析图像数据失败: ${error.message}`);
          }
          continue;
        }

        // 未知块类型，尝试跳过
        this.addWarning(
          `未知块类型: 0x${blockType.toString(16)} at offset ${this.offset}`
        );
        this.offset++;

        // 防止无限循环
        if (this.getBytesRemaining() <= 0) {
          break;
        }
      }

      // 验证解析结果
      this.validateParsedData();

      return {
        header: this.header,
        logicalScreen: this.logicalScreen,
        globalColorTable: this.globalColorTable,
        frames: this.frames,
        loopCount: this.loopCount,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      this.addError(`GIF解析失败: ${error.message}`);
      if (this.options.strict) {
        throw error;
      }
      return {
        header: this.header,
        logicalScreen: this.logicalScreen,
        globalColorTable: this.globalColorTable,
        frames: this.frames,
        loopCount: this.loopCount || 1,
        errors: this.errors,
        warnings: this.warnings,
      };
    }
  }

  // 错误处理方法
  addError(message) {
    this.errors.push(message);
    console.error("[GifParser Error]", message);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.warn("[GifParser Warning]", message);
  }

  handleError(message) {
    this.addError(message);
    if (this.options.strict) {
      throw new Error(message);
    }
  }

  // 验证解析后的数据
  validateParsedData() {
    if (this.options.validateFrames) {
      this.frames.forEach((frame, index) => {
        if (frame.width <= 0 || frame.height <= 0) {
          this.addWarning(`帧${index}尺寸异常: ${frame.width}x${frame.height}`);
        }

        if (!frame.imageData || frame.imageData.length === 0) {
          this.addWarning(`帧${index}缺少图像数据`);
        }

        if (!frame.colorTable || frame.colorTable.length === 0) {
          this.addWarning(`帧${index}缺少颜色表`);
        }
      });
    }
  }

  // 获取GIF信息摘要
  getInfo() {
    return {
      version: this.header.version,
      width: this.logicalScreen.width,
      height: this.logicalScreen.height,
      frameCount: this.frames.length,
      loopCount: this.loopCount,
      hasGlobalColorTable: this.logicalScreen.hasGlobalColorTable,
      globalColorTableSize: this.logicalScreen.globalColorTableSize,
      totalDuration:
        this.frames.reduce((sum, frame) => sum + (frame.delayTime || 0), 0) *
        10, // 毫秒
    };
  }

  // 验证GIF文件完整性
  validate() {
    const errors = [];
    const warnings = [];

    // 检查头部
    if (!this.header.signature || this.header.signature !== "GIF") {
      errors.push("无效的GIF签名");
    }

    if (!this.header.version || !["87a", "89a"].includes(this.header.version)) {
      warnings.push("不标准的GIF版本");
    }

    // 检查逻辑屏幕描述符
    if (this.logicalScreen.width <= 0 || this.logicalScreen.height <= 0) {
      errors.push("无效的屏幕尺寸");
    }

    // 检查帧
    if (this.frames.length === 0) {
      warnings.push("GIF中没有图像帧");
    }

    this.frames.forEach((frame, index) => {
      if (frame.width <= 0 || frame.height <= 0) {
        errors.push(`帧${index}尺寸无效`);
      }

      if (!frame.colorTable || frame.colorTable.length === 0) {
        errors.push(`帧${index}缺少颜色表`);
      }

      if (!frame.imageData || frame.imageData.length === 0) {
        errors.push(`帧${index}缺少图像数据`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  }
}

// GIF帧渲染器 - 改进版（修复背景色问题，添加数据验证）
class GifRenderer {
  constructor(gifData, options = {}) {
    // 验证输入数据
    if (!gifData) {
      throw new Error("GIF数据不能为空");
    }

    if (!gifData.logicalScreen) {
      throw new Error("GIF数据缺少逻辑屏幕信息");
    }

    if (!gifData.frames || !Array.isArray(gifData.frames)) {
      console.warn("GIF数据缺少帧信息，创建空帧数组");
      gifData.frames = [];
    }

    // 验证逻辑屏幕尺寸
    if (
      !gifData.logicalScreen.width ||
      !gifData.logicalScreen.height ||
      gifData.logicalScreen.width <= 0 ||
      gifData.logicalScreen.height <= 0
    ) {
      console.warn("GIF逻辑屏幕尺寸无效，使用默认尺寸");
      gifData.logicalScreen.width = gifData.logicalScreen.width || 100;
      gifData.logicalScreen.height = gifData.logicalScreen.height || 100;
    }

    this.gifData = gifData;
    this.frameIndex = 0;
    this.options = {
      autoPlay: false,
      loop: true,
      scale: 1,
      backgroundColor: "auto", // 'auto', 'transparent', 'white', 'black', 或具体颜色值
      ...options,
    };
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.isPlaying = false;
    this.currentFrameIndex = 0;
    this.animationId = null;
    this.frameHistory = []; // 用于处理 disposal method
    this.previousFrameCanvas = null; // 保存上一帧状态

    // 设置画布尺寸
    this.canvas.width = this.gifData.logicalScreen.width * this.options.scale;
    this.canvas.height = this.gifData.logicalScreen.height * this.options.scale;

    // 设置缩放
    if (this.options.scale !== 1) {
      this.ctx.scale(this.options.scale, this.options.scale);
    }

    // 确定实际使用的背景色
    this.actualBackgroundColor = this.determineBackgroundColor();

    // 初始化背景
    this.initializeBackground();

    // 创建背景画布用于disposal method处理
    this.createBackgroundCanvas();

    // 输出调试信息
    console.log(
      `GifRenderer初始化完成: ${this.gifData.frames.length} 帧, 尺寸: ${this.gifData.logicalScreen.width}x${this.gifData.logicalScreen.height}`
    );
  }

  // 确定实际使用的背景色
  determineBackgroundColor() {
    if (this.options.backgroundColor === "auto") {
      // 自动模式：优先使用GIF的背景色，如果没有则使用透明
      const bgColorIndex = this.gifData.logicalScreen.backgroundColorIndex;
      if (
        this.gifData.globalColorTable &&
        bgColorIndex < this.gifData.globalColorTable.length
      ) {
        const bgColor = this.gifData.globalColorTable[bgColorIndex];
        return `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
      }
      return "transparent";
    }

    if (this.options.backgroundColor === "white") {
      return "rgb(255, 255, 255)";
    }

    if (this.options.backgroundColor === "black") {
      return "rgb(0, 0, 0)";
    }

    return this.options.backgroundColor; // 'transparent' 或其他具体颜色值
  } // 渲染指定帧（修复版本 - 支持透明度和帧处理方式，添加兜底方案）
  renderFrame(frameIndex) {
    // 验证GIF数据和帧数组
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      console.warn("GIF数据无效或没有帧数据");
      return this.canvas;
    }

    // 索引兜底处理
    if (frameIndex < 0) {
      console.warn(`帧索引 ${frameIndex} 小于0，使用第一帧`);
      frameIndex = 0;
    } else if (frameIndex >= this.gifData.frames.length) {
      console.warn(
        `帧索引 ${frameIndex} 超出范围 (最大: ${
          this.gifData.frames.length - 1
        })，使用最后一帧`
      );
      frameIndex = this.gifData.frames.length - 1;
    }

    const frame = this.gifData.frames[frameIndex];

    // 验证帧数据
    if (!frame) {
      console.error(`帧 ${frameIndex} 数据无效`);
      return this.canvas;
    }

    // 处理帧处理方式（disposal method）
    if (frameIndex > 0) {
      const prevFrame = this.gifData.frames[frameIndex - 1];
      switch (prevFrame.disposalMethod) {
        case 0: // 未指定，不处理
        case 1: // 不处理，保持当前画布内容
          break;
        case 2: // 恢复到背景色
          this.clearFrameArea(prevFrame);
          break;
        case 3: // 恢复到上一帧之前的状态
          this.restoreCanvasState();
          break;
      }
    } else {
      // 第一帧，清空画布
      this.clearCanvas();
    }

    // 保存当前状态（用于disposal method 3）
    if (frame.disposalMethod === 3) {
      this.saveCanvasState();
    } // 解码图像数据（添加更好的错误处理）
    let pixels;
    try {
      // 验证帧数据
      if (!frame.imageData || frame.imageData.length === 0) {
        console.warn(`帧 ${frameIndex} 没有图像数据，跳过解码`);
        this.currentFrameIndex = frameIndex;
        return this.canvas;
      }

      if (
        !frame.width ||
        !frame.height ||
        frame.width <= 0 ||
        frame.height <= 0
      ) {
        console.warn(
          `帧 ${frameIndex} 尺寸无效 (${frame.width}x${frame.height})，跳过渲染`
        );
        this.currentFrameIndex = frameIndex;
        return this.canvas;
      }

      const expectedPixelCount = frame.width * frame.height;
      pixels = this.decodeLzw(
        frame.imageData,
        frame.lzwMinCodeSize,
        expectedPixelCount
      );

      // 验证解码结果
      if (!pixels || pixels.length === 0) {
        console.warn(`帧 ${frameIndex} 解码结果为空，使用默认像素`);
        pixels = new Uint8Array(expectedPixelCount).fill(0);
      } else if (pixels.length !== expectedPixelCount) {
        console.warn(
          `帧 ${frameIndex} 解码像素数不匹配: 期望 ${expectedPixelCount}, 实际 ${pixels.length}`
        );
        // 调整像素数组大小
        if (pixels.length < expectedPixelCount) {
          const newPixels = new Uint8Array(expectedPixelCount);
          newPixels.set(pixels);
          pixels = newPixels;
        } else {
          pixels = pixels.slice(0, expectedPixelCount);
        }
      }
    } catch (error) {
      console.error(`解码帧${frameIndex}失败: ${error.message}`);
      // 创建空白像素数组作为兜底
      const expectedPixelCount = (frame.width || 1) * (frame.height || 1);
      pixels = new Uint8Array(expectedPixelCount).fill(0);
    }

    // 处理交错模式
    if (frame.isInterlaced) {
      pixels = this.deinterlace(pixels, frame.width, frame.height);
    }

    // 创建临时画布用于处理透明度
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = frame.width;
    tempCanvas.height = frame.height;
    const tempCtx = tempCanvas.getContext("2d");

    // 创建ImageData
    const imageData = tempCtx.createImageData(frame.width, frame.height);
    const pixelData = imageData.data; // 将像素数据转换为RGBA格式（修复背景色版本）
    for (let i = 0; i < pixels.length && i < frame.width * frame.height; i++) {
      const colorIndex = pixels[i];
      const offset = i * 4;

      // 验证颜色索引范围
      if (colorIndex >= frame.colorTable.length) {
        // 颜色索引超出范围的处理
        if (frame.transparentColorFlag) {
          // 如果支持透明，设为透明
          pixelData[offset] = 0;
          pixelData[offset + 1] = 0;
          pixelData[offset + 2] = 0;
          pixelData[offset + 3] = 0; // 透明
        } else {
          // 如果不支持透明，使用背景色或白色
          const bgColorIndex = this.gifData.logicalScreen.backgroundColorIndex;
          if (
            this.gifData.globalColorTable &&
            bgColorIndex < this.gifData.globalColorTable.length
          ) {
            const bgColor = this.gifData.globalColorTable[bgColorIndex];
            pixelData[offset] = bgColor.r;
            pixelData[offset + 1] = bgColor.g;
            pixelData[offset + 2] = bgColor.b;
            pixelData[offset + 3] = 255;
          } else {
            // 默认使用白色而不是黑色
            pixelData[offset] = 255;
            pixelData[offset + 1] = 255;
            pixelData[offset + 2] = 255;
            pixelData[offset + 3] = 255;
          }
        }
        continue;
      }

      // 检查透明度
      if (
        frame.transparentColorFlag &&
        colorIndex === frame.transparentColorIndex
      ) {
        pixelData[offset] = 0; // R
        pixelData[offset + 1] = 0; // G
        pixelData[offset + 2] = 0; // B
        pixelData[offset + 3] = 0; // A (透明)
      } else {
        const color = frame.colorTable[colorIndex];
        if (color) {
          pixelData[offset] = color.r;
          pixelData[offset + 1] = color.g;
          pixelData[offset + 2] = color.b;
          pixelData[offset + 3] = 255; // 完全不透明
        } else {
          // 颜色表中没有该颜色，使用背景色或白色
          const bgColorIndex = this.gifData.logicalScreen.backgroundColorIndex;
          if (
            this.gifData.globalColorTable &&
            bgColorIndex < this.gifData.globalColorTable.length
          ) {
            const bgColor = this.gifData.globalColorTable[bgColorIndex];
            pixelData[offset] = bgColor.r;
            pixelData[offset + 1] = bgColor.g;
            pixelData[offset + 2] = bgColor.b;
            pixelData[offset + 3] = 255;
          } else {
            // 默认使用白色而不是黑色
            pixelData[offset] = 255;
            pixelData[offset + 1] = 255;
            pixelData[offset + 2] = 255;
            pixelData[offset + 3] = 255;
          }
        }
      }
    }

    // 将ImageData绘制到临时画布
    tempCtx.putImageData(imageData, 0, 0);

    // 将临时画布绘制到主画布上
    this.ctx.drawImage(tempCanvas, frame.left, frame.top);

    this.currentFrameIndex = frameIndex;
    return this.canvas;
  } // 清除指定帧区域到背景色（修复版本）
  clearFrameArea(frame) {
    if (this.actualBackgroundColor !== "transparent") {
      this.ctx.fillStyle = this.actualBackgroundColor;
      this.ctx.fillRect(frame.left, frame.top, frame.width, frame.height);
    } else {
      // 透明背景，清除该区域
      this.ctx.clearRect(frame.left, frame.top, frame.width, frame.height);
    }
  }

  // 处理交错图像
  deinterlace(pixels, width, height) {
    const deinterlaced = new Uint8Array(pixels.length);
    const passes = [
      { start: 0, step: 8 }, // Pass 1: every 8th row, starting with row 0
      { start: 4, step: 8 }, // Pass 2: every 8th row, starting with row 4
      { start: 2, step: 4 }, // Pass 3: every 4th row, starting with row 2
      { start: 1, step: 2 }, // Pass 4: every 2nd row, starting with row 1
    ];

    let srcIndex = 0;
    for (const pass of passes) {
      for (let row = pass.start; row < height; row += pass.step) {
        const destOffset = row * width;
        for (let col = 0; col < width; col++) {
          if (srcIndex < pixels.length) {
            deinterlaced[destOffset + col] = pixels[srcIndex++];
          }
        }
      }
    }

    return deinterlaced;
  } // 清空画布到背景色（修复版本）
  clearCanvas() {
    if (this.actualBackgroundColor !== "transparent") {
      this.ctx.fillStyle = this.actualBackgroundColor;
      this.ctx.fillRect(
        0,
        0,
        this.gifData.logicalScreen.width,
        this.gifData.logicalScreen.height
      );
    } else {
      // 透明背景，清除所有内容
      this.ctx.clearRect(
        0,
        0,
        this.gifData.logicalScreen.width,
        this.gifData.logicalScreen.height
      );
    }
  }
  // 播放动画（添加安全检查）
  play(onFrameChange) {
    if (this.isPlaying) {
      return;
    }

    // 验证是否有可播放的帧
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      console.warn("没有可播放的帧");
      return;
    }

    this.isPlaying = true;
    this.currentFrameIndex = 0;
    let loopCount = 0;
    const maxLoops =
      this.gifData.loopCount === 0 ? Infinity : this.gifData.loopCount || 1;

    const playNextFrame = () => {
      if (!this.isPlaying) {
        return;
      }

      // 确保帧索引有效
      this.currentFrameIndex = this.getSafeFrameIndex(this.currentFrameIndex);
      const frame = this.getFrameSafely(this.currentFrameIndex);

      if (!frame) {
        console.warn(`无法获取帧 ${this.currentFrameIndex}，停止播放`);
        this.isPlaying = false;
        return;
      }

      try {
        this.renderFrame(this.currentFrameIndex);

        if (onFrameChange) {
          onFrameChange(this.currentFrameIndex, frame);
        }
      } catch (error) {
        console.error(`渲染帧 ${this.currentFrameIndex} 失败:`, error);
        // 继续播放下一帧而不是停止
      } // 计算延迟时间（至少10ms）
      const delay = Math.max((frame.delayTime || 10) * 10, 10);

      setTimeout(() => {
        if (!this.isPlaying) {
          return;
        }

        this.currentFrameIndex++;
        const frameCount = this.getFrameCount();

        if (this.currentFrameIndex >= frameCount) {
          this.currentFrameIndex = 0;
          loopCount++;

          if (loopCount >= maxLoops) {
            this.isPlaying = false;
            return;
          }
        }
        playNextFrame();
      }, delay);
    };

    playNextFrame();
  }

  // 停止播放
  stop() {
    this.isPlaying = false;
  }

  // 暂停播放
  pause() {
    this.isPlaying = false;
  } // 解码LZW压缩数据的算法（修复版本）
  decodeLzw(compressedData, lzwMinCodeSize, pixelCount) {
    if (!compressedData || compressedData.length === 0) {
      throw new Error("LZW压缩数据为空");
    }

    // 初始化码表和参数
    const clearCode = 1 << lzwMinCodeSize;
    const endCode = clearCode + 1;
    let codeSize = lzwMinCodeSize + 1;
    let codeMask = (1 << codeSize) - 1;
    let nextCode = endCode + 1;

    // 创建初始码表
    const codeTable = [];
    for (let i = 0; i < clearCode; i++) {
      codeTable[i] = [i];
    }
    codeTable[clearCode] = []; // clearCode
    codeTable[endCode] = null; // endCode

    const pixels = [];
    let dataIndex = 0;
    let bits = 0;
    let bitsCount = 0;

    // 读取一个码
    const readCode = () => {
      while (bitsCount < codeSize) {
        if (dataIndex >= compressedData.length) {
          return endCode; // 数据结束
        }

        const byte = compressedData[dataIndex++];
        bits |= byte << bitsCount;
        bitsCount += 8;
      }

      const code = bits & codeMask;
      bits >>= codeSize;
      bitsCount -= codeSize;

      return code;
    };

    try {
      // 开始解码
      let code = readCode();
      if (code !== clearCode) {
        throw new Error("LZW数据流应该以clearCode开始");
      }

      code = readCode();
      if (code === endCode) {
        return new Uint8Array(pixels);
      }

      if (code >= codeTable.length) {
        throw new Error("无效的初始LZW码");
      }

      let oldCode = code;
      const firstPixel = codeTable[oldCode][0];
      pixels.push(firstPixel);

      while (pixels.length < pixelCount) {
        code = readCode();

        if (code === endCode) {
          break;
        }

        if (code === clearCode) {
          // 重置码表
          codeSize = lzwMinCodeSize + 1;
          codeMask = (1 << codeSize) - 1;
          nextCode = endCode + 1;
          codeTable.length = nextCode;

          code = readCode();
          if (code === endCode) {
            break;
          }

          if (code >= clearCode) {
            throw new Error("clearCode后的码无效");
          }

          pixels.push(code);
          oldCode = code;
          continue;
        }

        // 处理常规码
        let outputPixels;
        if (code < codeTable.length && codeTable[code] !== undefined) {
          // 码已在表中
          outputPixels = codeTable[code];
        } else if (code === nextCode) {
          // 特殊情况：码还未在表中
          outputPixels = [...codeTable[oldCode], codeTable[oldCode][0]];
        } else {
          throw new Error(`无效的LZW码: ${code} at nextCode: ${nextCode}`);
        }

        // 输出像素
        for (let i = 0; i < outputPixels.length; i++) {
          pixels.push(outputPixels[i]);
        }

        // 添加新条目到码表
        if (nextCode < 4096) {
          // LZW最大码表大小
          codeTable[nextCode] = [...codeTable[oldCode], outputPixels[0]];
          nextCode++;

          // 检查是否需要增加码大小
          if (nextCode === 1 << codeSize && codeSize < 12) {
            codeSize++;
            codeMask = (1 << codeSize) - 1;
          }
        }

        oldCode = code;
      }

      return new Uint8Array(pixels.slice(0, pixelCount));
    } catch (error) {
      throw new Error(`LZW解码失败: ${error.message}`);
    }
  }

  // 导出当前帧为PNG
  exportCurrentFrame() {
    return this.canvas.toDataURL("image/png");
  }

  // 导出所有帧
  exportAllFrames() {
    const frames = [];
    for (let i = 0; i < this.gifData.frames.length; i++) {
      this.renderFrame(i);
      frames.push(this.exportCurrentFrame());
    }
    return frames;
  } // 初始化背景（修复版本）
  initializeBackground() {
    if (this.actualBackgroundColor !== "transparent") {
      this.ctx.fillStyle = this.actualBackgroundColor;
      this.ctx.fillRect(
        0,
        0,
        this.gifData.logicalScreen.width,
        this.gifData.logicalScreen.height
      );
    }
    // 如果是透明背景，不绘制任何内容
  }
  // 获取帧信息（安全版本）
  getFrameInfo(frameIndex) {
    const frame = this.getFrameSafely(frameIndex);
    if (!frame) {
      return null;
    }

    return {
      index: frameIndex,
      width: frame.width || 0,
      height: frame.height || 0,
      left: frame.left || 0,
      top: frame.top || 0,
      delayTime: frame.delayTime || 0,
      disposalMethod: frame.disposalMethod || 0,
      transparentColorFlag: frame.transparentColorFlag || false,
      isInterlaced: frame.isInterlaced || false,
    };
  }

  // 验证帧索引是否有效
  isValidFrameIndex(frameIndex) {
    return (
      this.gifData &&
      this.gifData.frames &&
      Array.isArray(this.gifData.frames) &&
      frameIndex >= 0 &&
      frameIndex < this.gifData.frames.length
    );
  }

  // 安全获取帧数据
  getFrameSafely(frameIndex) {
    if (!this.isValidFrameIndex(frameIndex)) {
      return null;
    }
    return this.gifData.frames[frameIndex];
  }

  // 获取有效的帧索引（带兜底）
  getSafeFrameIndex(frameIndex) {
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      return 0;
    }

    if (frameIndex < 0) {
      return 0;
    }

    if (frameIndex >= this.gifData.frames.length) {
      return this.gifData.frames.length - 1;
    }

    return frameIndex;
  }

  // 跳转到指定帧（添加兜底方案）
  gotoFrame(frameIndex) {
    // 验证GIF数据
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      console.warn("GIF数据无效，无法跳转帧");
      return;
    }

    // 索引兜底处理
    if (frameIndex < 0) {
      console.warn(`帧索引 ${frameIndex} 小于0，跳转到第一帧`);
      frameIndex = 0;
    } else if (frameIndex >= this.gifData.frames.length) {
      console.warn(
        `帧索引 ${frameIndex} 超出范围 (最大: ${
          this.gifData.frames.length - 1
        })，跳转到最后一帧`
      );
      frameIndex = this.gifData.frames.length - 1;
    }

    this.currentFrameIndex = frameIndex;
    this.renderFrame(frameIndex);
  }
  // 下一帧（添加安全检查）
  nextFrame() {
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      console.warn("GIF数据无效，无法跳转到下一帧");
      return 0;
    }

    const nextIndex = (this.currentFrameIndex + 1) % this.gifData.frames.length;
    this.gotoFrame(nextIndex);
    return nextIndex;
  }

  // 上一帧（添加安全检查）
  prevFrame() {
    if (
      !this.gifData ||
      !this.gifData.frames ||
      this.gifData.frames.length === 0
    ) {
      console.warn("GIF数据无效，无法跳转到上一帧");
      return 0;
    }

    const prevIndex =
      this.currentFrameIndex === 0
        ? this.gifData.frames.length - 1
        : this.currentFrameIndex - 1;
    this.gotoFrame(prevIndex);
    return prevIndex;
  }

  // 重置到第一帧
  reset() {
    this.stop();
    this.currentFrameIndex = 0;
    this.frameHistory = [];
    this.initializeBackground();
    if (this.gifData.frames.length > 0) {
      this.renderFrame(0);
    }
  }
  // 获取当前帧索引（安全版本）
  getCurrentFrameIndex() {
    return this.getSafeFrameIndex(this.currentFrameIndex);
  }

  // 获取总帧数（安全版本）
  getFrameCount() {
    if (
      !this.gifData ||
      !this.gifData.frames ||
      !Array.isArray(this.gifData.frames)
    ) {
      return 0;
    }
    return this.gifData.frames.length;
  }

  // 获取播放状态（安全版本）
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentFrame: this.getCurrentFrameIndex(),
      totalFrames: this.getFrameCount(),
      loopCount: this.gifData ? this.gifData.loopCount || 0 : 0,
    };
  }

  // 导出指定帧为图片
  exportFrame(frameIndex, format = "image/png", quality = 0.92) {
    if (frameIndex !== undefined) {
      this.renderFrame(frameIndex);
    }
    return this.canvas.toDataURL(format, quality);
  }

  // 导出所有帧
  exportAllFrames(format = "image/png", quality = 0.92) {
    const frames = [];
    const originalIndex = this.currentFrameIndex;

    for (let i = 0; i < this.gifData.frames.length; i++) {
      this.renderFrame(i);
      frames.push({
        index: i,
        dataUrl: this.canvas.toDataURL(format, quality),
        info: this.getFrameInfo(i),
      });
    }

    // 恢复原始帧
    this.renderFrame(originalIndex);
    return frames;
  }

  // 创建精灵图
  createSpriteSheet(columns = 0) {
    if (this.gifData.frames.length === 0) {
      return null;
    }

    // 自动计算列数
    if (columns === 0) {
      columns = Math.ceil(Math.sqrt(this.gifData.frames.length));
    }

    const rows = Math.ceil(this.gifData.frames.length / columns);
    const frameWidth = this.gifData.logicalScreen.width;
    const frameHeight = this.gifData.logicalScreen.height;

    const spriteCanvas = document.createElement("canvas");
    const spriteCtx = spriteCanvas.getContext("2d");

    spriteCanvas.width = frameWidth * columns;
    spriteCanvas.height = frameHeight * rows;

    // 绘制所有帧到精灵图
    for (let i = 0; i < this.gifData.frames.length; i++) {
      this.renderFrame(i);

      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = col * frameWidth;
      const y = row * frameHeight;

      spriteCtx.drawImage(this.canvas, x, y);
    }

    return spriteCanvas;
  }

  // 销毁渲染器
  destroy() {
    this.stop();
    this.canvas = null;
    this.ctx = null;
    this.gifData = null;
  }
  // 创建背景画布（修复版本）
  createBackgroundCanvas() {
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundCanvas.width = this.gifData.logicalScreen.width;
    this.backgroundCanvas.height = this.gifData.logicalScreen.height;
    this.backgroundCtx = this.backgroundCanvas.getContext("2d");

    // 只有在有有效背景色时才绘制背景
    const bgColorIndex = this.gifData.logicalScreen.backgroundColorIndex;
    if (
      this.gifData.globalColorTable &&
      bgColorIndex < this.gifData.globalColorTable.length
    ) {
      const bgColor = this.gifData.globalColorTable[bgColorIndex];
      this.backgroundCtx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
      this.backgroundCtx.fillRect(
        0,
        0,
        this.backgroundCanvas.width,
        this.backgroundCanvas.height
      );
    }
    // 如果没有有效背景色，背景画布保持透明
  }

  // 保存当前画布状态
  saveCanvasState() {
    if (!this.previousFrameCanvas) {
      this.previousFrameCanvas = document.createElement("canvas");
      this.previousFrameCanvas.width = this.gifData.logicalScreen.width;
      this.previousFrameCanvas.height = this.gifData.logicalScreen.height;
    }

    const prevCtx = this.previousFrameCanvas.getContext("2d");
    prevCtx.clearRect(
      0,
      0,
      this.previousFrameCanvas.width,
      this.previousFrameCanvas.height
    );
    prevCtx.drawImage(
      this.canvas,
      0,
      0,
      this.gifData.logicalScreen.width,
      this.gifData.logicalScreen.height,
      0,
      0,
      this.previousFrameCanvas.width,
      this.previousFrameCanvas.height
    );
  }

  // 恢复画布状态
  restoreCanvasState() {
    if (this.previousFrameCanvas) {
      this.ctx.clearRect(
        0,
        0,
        this.gifData.logicalScreen.width,
        this.gifData.logicalScreen.height
      );
      this.ctx.drawImage(this.previousFrameCanvas, 0, 0);
    }
  }

  // 诊断GIF数据和渲染器状态
  diagnose() {
    const report = {
      timestamp: new Date().toISOString(),
      gifData: {
        valid: !!this.gifData,
        hasLogicalScreen: !!(this.gifData && this.gifData.logicalScreen),
        hasFrames: !!(this.gifData && this.gifData.frames),
        frameCount: this.getFrameCount(),
        dimensions:
          this.gifData && this.gifData.logicalScreen
            ? `${this.gifData.logicalScreen.width}x${this.gifData.logicalScreen.height}`
            : "unknown",
      },
      renderer: {
        currentFrameIndex: this.currentFrameIndex,
        safeFrameIndex: this.getSafeFrameIndex(this.currentFrameIndex),
        isPlaying: this.isPlaying,
        canvasSize: `${this.canvas.width}x${this.canvas.height}`,
        scale: this.options.scale,
        backgroundColor: this.options.backgroundColor,
      },
      frames: [],
    };

    // 检查每一帧的状态
    if (this.gifData && this.gifData.frames) {
      for (let i = 0; i < Math.min(this.gifData.frames.length, 10); i++) {
        // 最多检查前10帧
        const frame = this.gifData.frames[i];
        report.frames.push({
          index: i,
          valid: !!frame,
          hasImageData: !!(
            frame &&
            frame.imageData &&
            frame.imageData.length > 0
          ),
          dimensions: frame
            ? `${frame.width || 0}x${frame.height || 0}`
            : "invalid",
          lzwMinCodeSize: frame ? frame.lzwMinCodeSize : "unknown",
          hasColorTable: !!(
            frame &&
            frame.colorTable &&
            frame.colorTable.length > 0
          ),
        });
      }
    }

    console.group("🔍 GifRenderer 诊断报告");
    console.table(report.gifData);
    console.table(report.renderer);
    if (report.frames.length > 0) {
      console.table(report.frames);
    }
    console.groupEnd();

    return report;
  }
}

// GIF工具类 - 提供额外的实用功能
class GifUtils {
  // 分析GIF文件的详细信息
  static analyzeGif(gifData) {
    const analysis = {
      fileSize: 0,
      compressionRatio: 0,
      averageFrameDelay: 0,
      totalPixels: 0,
      uniqueColors: new Set(),
      memoryUsage: 0,
    };

    // 计算平均帧延迟
    if (gifData.frames.length > 0) {
      const totalDelay = gifData.frames.reduce(
        (sum, frame) => sum + (frame.delayTime || 0),
        0
      );
      analysis.averageFrameDelay = totalDelay / gifData.frames.length;
    }

    // 分析颜色使用情况
    gifData.frames.forEach((frame) => {
      analysis.totalPixels += frame.width * frame.height;

      if (frame.colorTable) {
        frame.colorTable.forEach((color) => {
          const colorKey = `${color.r},${color.g},${color.b}`;
          analysis.uniqueColors.add(colorKey);
        });
      }
    });

    // 估算内存使用量
    analysis.memoryUsage = analysis.totalPixels * 4; // RGBA每像素4字节

    return {
      ...analysis,
      uniqueColors: analysis.uniqueColors.size,
      framesPerSecond:
        analysis.averageFrameDelay > 0 ? 100 / analysis.averageFrameDelay : 0,
    };
  }

  // 优化GIF颜色表
  static optimizeColorTable(colorTable, maxColors = 256) {
    if (colorTable.length <= maxColors) {
      return colorTable;
    }

    // 简单的颜色量化算法
    const optimized = [];
    const step = Math.ceil(colorTable.length / maxColors);

    for (let i = 0; i < colorTable.length; i += step) {
      optimized.push(colorTable[i]);
    }

    return optimized;
  }

  // 创建调色板图像
  static createPaletteImage(colorTable, width = 16, height = 16) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const cols = Math.ceil(Math.sqrt(colorTable.length));
    const rows = Math.ceil(colorTable.length / cols);

    canvas.width = cols * width;
    canvas.height = rows * height;

    colorTable.forEach((color, index) => {
      const x = (index % cols) * width;
      const y = Math.floor(index / cols) * height;

      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(x, y, width, height);
    });

    return canvas;
  }
}

// GIF导出器 - 用于创建新的GIF文件
class GifExporter {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.options = {
      quality: 10,
      repeat: 0,
      background: "#fff",
      ...options,
    };
    this.frames = [];
  }

  // 添加帧
  addFrame(canvas, delay = 100) {
    this.frames.push({
      canvas: canvas,
      delay: delay,
    });
  }

  // 导出为GIF（简化版，实际实现需要更复杂的编码）
  export() {
    console.warn("GIF导出功能需要额外的编码库支持");
    return null;
  }
}
