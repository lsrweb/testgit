# GIF压缩工具模块使用说明

## 概述
`GifCompressor.js` 是一个独立的GIF压缩工具模块，不依赖Vue或其他框架，可以在任何JavaScript环境中使用。

## 功能特性
- ✅ **独立压缩模块** - 不依赖Vue等框架
- ✅ **多种压缩模式** - 高质量、平衡、高压缩三种模式
- ✅ **文件格式转换** - 支持File、Blob、Base64之间的互转
- ✅ **批量处理** - 支持批量压缩多个GIF文件
- ✅ **进度回调** - 实时获取压缩进度
- ✅ **GIF信息获取** - 获取GIF的基本信息（尺寸、帧数等）
- ✅ **图像处理选项** - 支持抖动算法、图像平滑等

## 快速开始

### 1. 引入必要文件
```html
<!-- 引入GIF处理库 -->
<script src="./gif/gif.js"></script>
<script src="./gif/gifuct-js.min.js"></script>
<!-- 引入压缩工具 -->
<script src="./GifCompressor.js"></script>
```

### 2. 创建压缩器实例
```javascript
const compressor = new GifCompressor();

// 设置进度回调（可选）
compressor.setProgressCallback((progress) => {
    console.log(`压缩进度: ${progress}%`);
});
```

### 3. 压缩GIF文件
```javascript
// 基本使用
const result = await compressor.compressGif(file);

// 带选项的压缩
const result = await compressor.compressGif(file, {
    mode: 'balanced',          // 压缩模式
    quality: 15,               // 质量 (5-20)
    scale: 0.7,               // 缩放比例 (0.1-1.0)
    useDithering: false,      // 是否使用抖动
    useSmoothing: true        // 是否使用平滑
});

// 结果包含以下信息
console.log(result);
/*
{
    blob: Blob,              // 压缩后的Blob对象
    base64: string,          // Base64字符串
    originalSize: number,    // 原始文件大小（字节）
    compressedSize: number,  // 压缩后大小（字节）
    compressionRatio: number,// 压缩率（百分比）
    downloadUrl: string      // 可用于下载的URL
}
*/
```

## API 参考

### 主要方法

#### `compressGif(file, options)`
压缩GIF文件

**参数:**
- `file` (File|Blob): 要压缩的GIF文件
- `options` (Object): 压缩选项
  - `mode` (string): 压缩模式 - 'high-quality' | 'balanced' | 'high-compression'
  - `quality` (number): 压缩质量 5-20，值越大质量越好
  - `scale` (number): 缩放比例 0.1-1.0
  - `useDithering` (boolean): 是否使用抖动算法
  - `useSmoothing` (boolean): 是否使用图像平滑

**返回:** Promise<Object> 压缩结果

#### `fileToBase64(file)`
将File对象转换为Base64字符串

**参数:**
- `file` (File): 文件对象

**返回:** Promise<string> Base64字符串

#### `base64ToBlob(base64, mimeType)`
将Base64字符串转换为Blob对象

**参数:**
- `base64` (string): Base64字符串
- `mimeType` (string): MIME类型，默认 'image/gif'

**返回:** Blob对象

#### `blobToFile(blob, filename)`
将Blob对象转换为File对象

**参数:**
- `blob` (Blob): Blob对象
- `filename` (string): 文件名

**返回:** File对象

#### `downloadBlob(blob, filename)`
下载Blob对象为文件

**参数:**
- `blob` (Blob): 要下载的Blob对象
- `filename` (string): 下载文件名，默认 'compressed.gif'

#### `batchCompress(files, options)`
批量压缩GIF文件

**参数:**
- `files` (Array<File>): 文件数组
- `options` (Object): 压缩选项（同compressGif）

**返回:** Promise<Array> 压缩结果数组

#### `getGifInfo(file)`
获取GIF文件信息

**参数:**
- `file` (File|Blob): GIF文件

**返回:** Promise<Object> GIF信息
```javascript
{
    width: number,       // 宽度
    height: number,      // 高度
    frameCount: number,  // 帧数
    fileSize: number,    // 文件大小
    duration: number,    // 总时长（毫秒）
    fps: number         // 帧率
}
```

#### `setProgressCallback(callback)`
设置进度回调函数

**参数:**
- `callback` (Function): 回调函数，接收进度参数 (0-100)

## 使用示例

### 示例1: 基本压缩
```javascript
// HTML文件选择器
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const compressor = new GifCompressor();
    
    try {
        const result = await compressor.compressGif(file);
        console.log(`原始大小: ${result.originalSize} 字节`);
        console.log(`压缩后: ${result.compressedSize} 字节`);
        console.log(`压缩率: ${result.compressionRatio}%`);
        
        // 下载压缩后的文件
        compressor.downloadBlob(result.blob, 'compressed.gif');
    } catch (error) {
        console.error('压缩失败:', error);
    }
});
```

### 示例2: 自定义选项压缩
```javascript
const compressor = new GifCompressor();

const options = {
    mode: 'high-quality',     // 高质量模式
    quality: 10,              // 较高质量
    scale: 0.8,              // 轻微缩放
    useDithering: true,      // 使用抖动
    useSmoothing: true       // 使用平滑
};

const result = await compressor.compressGif(file, options);
```

### 示例3: 文件格式转换
```javascript
const compressor = new GifCompressor();

// 文件转Base64
const base64 = await compressor.fileToBase64(file);
console.log('Base64:', base64);

// Base64转Blob
const blob = compressor.base64ToBlob(base64);
console.log('Blob大小:', blob.size);

// Blob转File
const newFile = compressor.blobToFile(blob, 'converted.gif');
console.log('文件名:', newFile.name);
```

### 示例4: 批量压缩
```javascript
const compressor = new GifCompressor();

// 假设有多个文件
const files = [file1, file2, file3];

const results = await compressor.batchCompress(files, {
    mode: 'balanced',
    quality: 15
});

results.forEach((result, index) => {
    if (result.success) {
        console.log(`文件 ${result.filename} 压缩成功，压缩率: ${result.result.compressionRatio}%`);
        compressor.downloadBlob(result.result.blob, `compressed_${result.filename}`);
    } else {
        console.error(`文件 ${result.filename} 压缩失败:`, result.error);
    }
});
```

### 示例5: 带进度显示
```javascript
const compressor = new GifCompressor();

// 设置进度回调
compressor.setProgressCallback((progress) => {
    // 更新进度条
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    
    // 更新进度文本
    const progressText = document.getElementById('progressText');
    progressText.textContent = `压缩进度: ${progress}%`;
});

const result = await compressor.compressGif(file);
```

## 压缩模式说明

### high-quality (高质量模式)
- 质量: 5 (最佳质量)
- 缩放: 0.9 (轻微缩放)
- 工作线程: 4
- 适用: 需要保持最佳视觉质量的场景

### balanced (平衡模式) - 默认
- 质量: 10 (平衡质量)
- 缩放: 0.7 (中等缩放)
- 工作线程: 2
- 适用: 大多数使用场景

### high-compression (高压缩模式)
- 质量: 15 (较低质量)
- 缩放: 0.5 (大幅缩放)
- 工作线程: 2
- 抖动: 启用
- 适用: 需要最小文件大小的场景

## 注意事项

1. **浏览器兼容性**: 需要现代浏览器支持 Canvas API 和 Web Workers
2. **内存使用**: 处理大型GIF文件时可能消耗较多内存
3. **处理时间**: 高质量模式处理时间较长，建议显示进度条
4. **文件大小**: 建议对超大文件进行预处理或分批处理
5. **错误处理**: 务必使用 try-catch 包裹异步调用

## 兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ❌ Internet Explorer

## 文件结构

```
project/
├── GifCompressor.js          # 主压缩模块
├── gif-compressor-example.html  # 完整使用示例
├── lashdfisgkiqfsduj.html    # Vue集成示例
└── gif/
    ├── gif.js               # GIF编码库
    └── gifuct-js.min.js     # GIF解码库
```
