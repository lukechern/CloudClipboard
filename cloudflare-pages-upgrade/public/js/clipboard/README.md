# 剪贴板功能模块化重构

## 文件结构

```
clipboard/
├── image-processor.js    # 图片处理和缩略图生成
├── ui-manager.js        # UI管理和界面更新
├── clipboard-core.js    # 核心剪贴板处理功能
└── README.md           # 说明文档
```

## 模块说明

### 1. image-processor.js
负责图片相关的处理功能：
- 图片文件转换为base64
- 生成缩略图
- 计算缩略图尺寸
- 文件大小格式化

### 2. ui-manager.js  
负责用户界面的管理：
- 图片预览区域更新
- 清空按钮状态管理
- 界面模式切换（纯图片模式/混合模式）
- DOM元素状态管理

### 3. clipboard-core.js
负责核心的剪贴板功能：
- 剪贴板内容读取
- 文件上传处理
- 粘贴事件处理
- 键盘快捷键
- 图片和文本添加

## 使用方式

在HTML中按以下顺序加载：
```html
<script src="js/clipboard/image-processor.js"></script>
<script src="js/clipboard/ui-manager.js"></script>
<script src="js/clipboard/clipboard-core.js"></script>
<script src="js/clipboard.js"></script>
```

## API兼容性

重构后保持了原有的API接口，现有代码无需修改：
- `window.clipboardHandler.getImagesData()`
- `window.clipboardHandler.hasImages()`
- `window.clipboardHandler.clearAll()`
- 等等...

## 优势

1. **可维护性**: 每个模块职责单一，便于维护和调试
2. **可扩展性**: 新功能可以独立添加到对应模块
3. **可测试性**: 每个模块可以独立测试
4. **代码复用**: 模块可以在其他项目中复用