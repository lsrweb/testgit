# GIF压缩工具使用说明

## 概述

这个工具提供了强大的GIF压缩功能，支持使用gif.js库进行高质量压缩，并在gif.js不可用时提供兜底方案。

## 文件说明

- `imageUtils.js` - 核心压缩工具类
- `gif-parser-example.html` - 完整的GIF解析和压缩示例（集成版）
- `gif-compress-test.html` - 简单的压缩功能测试页面
- `GifParser.js` - GIF解析器（依赖项）

## 功能特性

### 🎯 核心功能
- ✅ GIF文件压缩和优化
- ✅ 尺寸调整（宽度/高度）
- ✅ 质量控制（1-30级别）
- ✅ 帧数减少（性能优化）
- ✅ 颜色优化和抖动
- ✅ 实时压缩预览
- ✅ 进度显示

### 🔧 技术特性
- ✅ 自动检测gif.js可用性
- ✅ 兜底压缩方案
- ✅ 错误处理和恢复
- ✅ 批量压缩支持
- ✅ 内存优化
- ✅ 跨浏览器兼容

## 使用方法

### 1. 快速开始

```html
<!DOCTYPE html>
<html>
<head>
  <script src="GifParser.js"></script>
  <script src="imageUtils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>
</head>
<body>
  <script>
    // 初始化
    const imageUtils = new ImageUtils();
    
    // 压缩GIF
    async function compressGif(file) {
      // 解析GIF
      const parser = await GifParser.fromFile(file);
      const gifData = parser.parse();
      
      // 压缩选项
      const options = {
        width: 400,        // 目标宽度
        height: 300,       // 目标高度
        quality: 10,       // 压缩质量 (1-30)
        maxFrames: 50,     // 最大帧数
        dither: false      // 抖动
      };
      
      // 执行压缩
      const compressed = await imageUtils.compressGif(gifData, options);
      
      // 下载结果
      imageUtils.downloadCompressedGif(compressed, 'compressed.gif');
    }
  </script>
</body>
</html>
```

### 2. 压缩选项详解

```javascript
const options = {
  // 尺寸设置
  width: null,           // 目标宽度，null=保持原始
  height: null,          // 目标高度，null=保持原始
  
  // 质量设置
  quality: 10,           // 压缩质量 1-30 (数字越小质量越高)
  maxFrames: null,       // 最大帧数，null=保持所有帧
  
  // 高级选项
  workers: 2,            // 工作线程数 (仅gif.js)
  dither: false,         // 启用抖动 (提高渐变质量)
  debug: false,          // 调试模式
  repeat: 0,             // 循环次数，0=无限循环
  
  // 回调函数
  onProgress: (progress) => {
    console.log(`压缩进度: ${Math.round(progress * 100)}%`);
  },
  onFrameAdded: (current, total) => {
    console.log(`添加帧: ${current}/${total}`);
  }
};
```

### 3. 压缩预览

```javascript
// 获取压缩预览信息
const preview = imageUtils.createCompressionPreview(gifData, options);

console.log('原始信息:', preview.original);
console.log('压缩后:', preview.compressed);
console.log('减少比例:', preview.reduction);
```

### 4. 兜底方案

当gif.js不可用时，工具会自动使用兜底方案：

```javascript
// 检查gif.js可用性
if (imageUtils.gifJsAvailable) {
  console.log('使用gif.js高质量压缩');
} else {
  console.log('使用兜底压缩方案');
}

// 兜底方案会生成JSON数据而不是GIF文件
const result = await imageUtils.compressGif(gifData, options);
if (result instanceof Blob) {
  // gif.js结果 - 真正的GIF文件
} else {
  // 兜底方案结果 - JSON格式的帧数据
  const data = JSON.parse(result);
  console.log('优化后帧数:', data.frames.length);
}
```

## API参考

### ImageUtils类

#### 构造函数
```javascript
const imageUtils = new ImageUtils();
```

#### 主要方法

##### compressGif(gifData, options)
压缩GIF文件
- `gifData`: 解析后的GIF数据
- `options`: 压缩选项对象
- 返回: `Promise<Blob|string>`

##### createCompressionPreview(gifData, options)
创建压缩预览信息
- 返回: 包含原始、压缩后和减少比例的对象

##### downloadCompressedGif(data, filename)
下载压缩后的文件
- `data`: 压缩结果数据
- `filename`: 文件名

##### batchCompress(gifDataList, options, onProgress)
批量压缩多个GIF
- `gifDataList`: GIF数据数组
- `onProgress`: 进度回调函数

## 性能优化建议

### 1. 文件大小优化
- 降低压缩质量 (quality: 15-25)
- 减少帧数 (maxFrames: 30-50)
- 调整尺寸 (width/height)

### 2. 速度优化
- 增加工作线程 (workers: 4-8)
- 禁用抖动 (dither: false)
- 批量处理时使用进度回调

### 3. 质量平衡
```javascript
// 高质量设置 (文件较大)
const highQuality = {
  quality: 5,
  dither: true,
  maxFrames: null
};

// 平衡设置 (推荐)
const balanced = {
  quality: 10,
  dither: false,
  maxFrames: 60
};

// 高压缩设置 (文件较小)
const highCompression = {
  quality: 20,
  dither: false,
  maxFrames: 30,
  width: Math.floor(original.width * 0.8),
  height: Math.floor(original.height * 0.8)
};
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### 依赖说明

1. **gif.js** (可选，推荐)
   - 提供高质量GIF压缩
   - CDN: `https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js`

2. **GifParser.js** (必需)
   - 解析GIF文件格式
   - 本地文件

## 故障排除

### 常见问题

1. **压缩失败**
   ```javascript
   // 检查GIF数据是否有效
   if (!gifData || !gifData.frames || gifData.frames.length === 0) {
     console.error('GIF数据无效');
   }
   ```

2. **内存不足**
   ```javascript
   // 减少工作线程和帧数
   const options = {
     workers: 1,
     maxFrames: 20
   };
   ```

3. **gif.js加载失败**
   ```javascript
   // 使用本地文件或检查网络
   if (!imageUtils.gifJsAvailable) {
     console.warn('gif.js不可用，将使用兜底方案');
   }
   ```

## 示例文件

- 打开 `gif-parser-example.html` 查看完整功能演示
- 打开 `gif-compress-test.html` 进行简单测试

## 许可证

MIT License - 可自由使用和修改
