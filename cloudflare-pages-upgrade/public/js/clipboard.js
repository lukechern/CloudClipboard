// 剪贴板图片处理功能 - 模块化重构版本
// 导入子模块（需要在HTML中按顺序加载）

// 兼容性包装类，保持原有API不变
class ClipboardImageHandler {
    constructor() {
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // 初始化各个模块
        window.imageProcessor = new ImageProcessor();
        window.uiManager = new UIManager();
        window.clipboardCore = new ClipboardCore();
    }

    // 保持原有API兼容性
    getImagesData() {
        return window.clipboardCore ? window.clipboardCore.getImagesData() : [];
    }

    hasImages() {
        return window.clipboardCore ? window.clipboardCore.hasImages() : false;
    }

    getImageCount() {
        return window.clipboardCore ? window.clipboardCore.getImageCount() : 0;
    }

    clearAll() {
        if (window.clipboardCore) {
            window.clipboardCore.clearAll();
        }
    }

    clearImages() {
        if (window.clipboardCore) {
            window.clipboardCore.clearImages();
        }
    }

    async addImage(file) {
        if (window.clipboardCore) {
            await window.clipboardCore.addImage(file);
        }
    }

    addText(text) {
        if (window.clipboardCore) {
            window.clipboardCore.addText(text);
        }
    }
}

// 全局实例
window.clipboardHandler = new ClipboardImageHandler();