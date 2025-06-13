# LDGIF API 使用文档

## 📖 概述

`LDGIF` 是一个功能强大的GIF压缩工具类，提供智能压缩、格式转换、批量处理等功能。支持浏览器和Node.js环境。

## 🚀 快速开始

### 安装依赖

在HTML页面中引入必要的依赖：

```html
<!-- GIF解析库 -->
<script src="./gif/gifuct-js.min.js"></script>
<!-- GIF编码库 -->
<script src="./gif/gif.js"></script>
<!-- GIF压缩工具 -->
<script src="./LDGIF.js"></script>
```

### 基本使用

```javascript
// 创建压缩器实例
const compressor = new LDGIF();

// 设置进度回调
compressor.setProgressCallback((progress) => {
    console.log(`压缩进度: ${progress}%`);
});

// 压缩GIF文件
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

try {
    const result = await compressor.compressGif(file);
    console.log('压缩完成:', result);
} catch (error) {
    console.error('压缩失败:', error.message);
}
```

## 📚 API 详细说明

### 构造函数

```javascript
const compressor = new LDGIF();
```

创建一个新的GIF压缩器实例。

### 核心方法

#### `compressGif(file, options)`

智能压缩GIF文件。

**参数:**
- `file` (File|Blob): 要压缩的GIF文件
- `options` (Object, 可选): 压缩选项
  - `quality` (number): 压缩质量，范围1-20，默认5
  - `scale` (number): 缩放比例，范围0.1-1.0，默认根据智能检测确定
  - `forceCompress` (boolean): 强制压缩，忽略条件检测，默认false

**返回值:** Promise<Object>
```javascript
{
    blob: Blob,              // 压缩后的Blob对象
    base64: string,          // Base64字符串
    originalSize: number,    // 原始文件大小（字节）
    compressedSize: number,  // 压缩后大小（字节）
    compressionRatio: number,// 压缩率（百分比）
    downloadUrl: string,     // 下载链接
    processed: boolean,      // 是否实际进行了压缩
    reason: string,          // 处理原因说明
    originalDimensions: string,  // 原始尺寸 "宽×高"
    newDimensions: string    // 新尺寸 "宽×高"
}
```

**示例:**
```javascript
const options = {
    quality: 8,
    scale: 0.8,
    forceCompress: false
};

const result = await compressor.compressGif(file, options);
console.log(`压缩率: ${result.compressionRatio}%`);
```

#### `batchCompress(files, options)`

批量压缩多个GIF文件。

**参数:**
- `files` (Array<File>): 文件数组
- `options` (Object, 可选): 压缩选项，同`compressGif`

**返回值:** Promise<Array>
```javascript
[
    {
        index: number,       // 文件索引
        filename: string,    // 文件名
        success: boolean,    // 是否成功
        result?: Object,     // 压缩结果（成功时）
        error?: string       // 错误信息（失败时）
    }
]
```

**示例:**
```javascript
const files = Array.from(fileInput.files);
const results = await compressor.batchCompress(files, { quality: 5 });
console.log(`成功: ${results.filter(r => r.success).length}个`);
```

#### `getGifInfo(file)`

获取GIF文件详细信息。

**参数:**
- `file` (File|Blob): GIF文件

**返回值:** Promise<Object>
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

**示例:**
```javascript
const info = await compressor.getGifInfo(file);
console.log(`${info.width}×${info.height}, ${info.frameCount}帧`);
```

### 格式转换方法

#### `fileToBase64(file)`

将File对象转换为Base64字符串。

**参数:**
- `file` (File): 文件对象

**返回值:** Promise<string>

**示例:**
```javascript
const base64 = await compressor.fileToBase64(file);
console.log('Base64:', base64);
```

#### `base64ToBlob(base64, mimeType)`

将Base64字符串转换为Blob对象。

**参数:**
- `base64` (string): Base64字符串
- `mimeType` (string, 可选): MIME类型，默认'image/gif'

**返回值:** Blob

**示例:**
```javascript
const blob = compressor.base64ToBlob(base64);
console.log('Blob大小:', blob.size);
```

#### `blobToFile(blob, filename)`

将Blob对象转换为File对象。

**参数:**
- `blob` (Blob): Blob对象
- `filename` (string): 文件名

**返回值:** File

**示例:**
```javascript
const file = compressor.blobToFile(blob, 'compressed.gif');
```

### 配置管理

#### `updateConfig(newConfig)`

更新压缩器配置。

**参数:**
- `newConfig` (Object): 新配置
  - `maxFileSize` (number): 触发压缩的最大文件大小（字节），默认6MB
  - `maxWidth` (number): 触发宽度压缩的最大宽度（像素），默认800px
  - `forceCompress` (boolean): 是否强制压缩，默认false

**示例:**
```javascript
compressor.updateConfig({
    maxFileSize: 8 * 1024 * 1024, // 8MB
    maxWidth: 1000,
    forceCompress: false
});
```

#### `getConfig()`

获取当前配置。

**返回值:** Object

**示例:**
```javascript
const config = compressor.getConfig();
console.log('当前配置:', config);
```

### 进度和回调

#### `setProgressCallback(callback)`

设置压缩进度回调函数。

**参数:**
- `callback` (Function): 回调函数，接收进度百分比参数(0-100)

**示例:**
```javascript
compressor.setProgressCallback((progress) => {
    document.getElementById('progressBar').style.width = progress + '%';
});
```

### 中间件系统

#### `addMiddleware(middleware)`

添加中间件函数，用于在压缩前对文件进行自定义处理。

**参数:**
- `middleware` (Function): 中间件函数，接收(file, info)参数

**示例:**
```javascript
// 添加文件大小检查中间件
compressor.addMiddleware(async (file, info) => {
    if (info.fileSize > 50 * 1024 * 1024) {
        return { shouldProcess: false }; // 阻止处理
    }
    return { shouldProcess: true };
});

// 添加文件修改中间件
compressor.addMiddleware(async (file, info) => {
    // 可以返回修改后的文件
    return { 
        shouldProcess: true, 
        file: modifiedFile, 
        info: modifiedInfo 
    };
});
```

#### `clearMiddlewares()`

清除所有中间件。

**示例:**
```javascript
compressor.clearMiddlewares();
```

### 工具方法

#### `downloadBlob(blob, filename)`

创建下载链接并自动下载文件。

**参数:**
- `blob` (Blob): 文件Blob对象
- `filename` (string, 可选): 下载文件名，默认'compressed.gif'

**示例:**
```javascript
compressor.downloadBlob(result.blob, 'my-compressed.gif');
```

## 🛠️ 高级用法

### 智能压缩策略

压缩器会根据以下条件自动判断是否需要压缩：

1. **文件大小检查**: 超过`maxFileSize`时触发压缩
2. **尺寸检查**: 宽度超过`maxWidth`时触发缩放
3. **强制模式**: 设置`forceCompress: true`强制压缩

### 中间件使用场景

```javascript
// 1. 文件类型过滤
compressor.addMiddleware(async (file, info) => {
    if (info.frameCount < 2) {
        return { shouldProcess: false }; // 跳过静态图片
    }
    return { shouldProcess: true };
});

// 2. 文件预处理
compressor.addMiddleware(async (file, info) => {
    // 记录处理日志
    console.log(`处理文件: ${file.name}, 尺寸: ${info.width}×${info.height}`);
    return { shouldProcess: true };
});

// 3. 条件压缩
compressor.addMiddleware(async (file, info) => {
    // 只处理大于1MB的文件
    if (info.fileSize < 1024 * 1024) {
        return { shouldProcess: false };
    }
    return { shouldProcess: true };
});
```

### 错误处理

```javascript
try {
    const result = await compressor.compressGif(file);
    // 处理成功结果
} catch (error) {
    if (error.message.includes('正在压缩中')) {
        console.log('请等待当前任务完成');
    } else if (error.message.includes('不是有效的GIF文件')) {
        console.log('文件格式错误');
    } else {
        console.error('未知错误:', error.message);
    }
}
```

### 批量处理结果处理

```javascript
const results = await compressor.batchCompress(files);

// 分析结果
const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`处理完成: 成功 ${successful.length}，失败 ${failed.length}`);

// 下载所有成功的文件
successful.forEach(result => {
    compressor.downloadBlob(result.result.blob, result.filename);
});

// 显示失败原因
failed.forEach(result => {
    console.error(`${result.filename} 失败: ${result.error}`);
});
```

## ⚡ 性能优化建议

1. **合理设置质量参数**: 小文件使用高质量(3-5)，大文件使用低质量(8-15)
2. **避免过度缩放**: 缩放比例建议不低于0.5
3. **批量处理**: 对于多文件，使用`batchCompress`而不是循环调用
4. **中间件优化**: 在中间件中尽早过滤不需要处理的文件
5. **内存管理**: 及时释放不需要的Blob URL

```javascript
// 释放下载URL
URL.revokeObjectURL(result.downloadUrl);
```

## 🔧 配置示例

### 保守压缩（适合重要图片）
```javascript
compressor.updateConfig({
    maxFileSize: 10 * 1024 * 1024, // 10MB才压缩
    maxWidth: 1200,                // 较大的宽度限制
    forceCompress: false
});

const result = await compressor.compressGif(file, {
    quality: 3,    // 高质量
    scale: 0.9     // 轻度缩放
});
```

### 激进压缩（适合网络传输）
```javascript
compressor.updateConfig({
    maxFileSize: 2 * 1024 * 1024,  // 2MB就压缩
    maxWidth: 600,                 // 较小的宽度限制
    forceCompress: true            // 强制压缩
});

const result = await compressor.compressGif(file, {
    quality: 10,   // 低质量
    scale: 0.6     // 大幅缩放
});
```

## 📝 注意事项

1. **依赖库**: 需要引入`gifuct-js`和`gif.js`库
2. **浏览器兼容性**: 支持现代浏览器，需要支持Promise、FileReader等API
3. **内存使用**: 处理大文件时会占用较多内存
4. **并发限制**: 同一时间只能进行一个压缩任务
5. **文件格式**: 仅支持GIF格式，会自动验证文件类型

## 🐛 常见问题

### Q: 压缩后文件更大了？
A: 这是正常的防反向压缩机制，系统会自动返回原文件。可以尝试调整压缩参数或设置`forceCompress: true`。

### Q: 压缩进度不更新？
A: 确保设置了进度回调函数：`compressor.setProgressCallback(callback)`

### Q: 批量处理时部分文件失败？
A: 检查失败文件的具体错误信息，可能是文件格式、大小或权限问题。

### Q: 中间件不生效？
A: 确保中间件函数返回正确的格式：`{ shouldProcess: boolean, file?, info? }`

## 🔗 相关链接

- [gif.js 文档](https://github.com/jnordberg/gif.js)
- [gifuct-js 文档](https://github.com/matt-way/gifuct-js)
- [MDN FileReader API](https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader)
