// WebView检测和优化脚本
// 专门解决安卓WebView中的性能问题

class WebViewOptimizer {
    constructor() {
        this.isAndroidWebView = this.detectAndroidWebView();
        this.isMobile = this.detectMobile();
        this.performanceMode = this.determinePerformanceMode();
        this.init();
    }

    // 检测是否为安卓WebView
    detectAndroidWebView() {
        const ua = navigator.userAgent;
        const isAndroid = ua.includes('Android');
        const isWebView = ua.includes('wv') || 
                         ua.includes('Version/') && ua.includes('Chrome') ||
                         !ua.includes('Chrome') && ua.includes('Safari');
        
        // 更精确的WebView检测
        const hasWebViewSignature = ua.includes('wv') || 
                                   (ua.includes('Version/') && !ua.includes('Mobile Safari'));
        
        return isAndroid && (isWebView || hasWebViewSignature);
    }

    // 检测移动设备
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 确定性能模式
    determinePerformanceMode() {
        if (this.isAndroidWebView) {
            return 'webview-optimized'; // WebView优化模式
        } else if (this.isMobile) {
            return 'mobile-optimized';  // 移动端优化模式
        } else {
            return 'desktop';           // 桌面端模式
        }
    }

    // 初始化优化设置
    init() {
        console.log('WebView优化器初始化:', {
            isAndroidWebView: this.isAndroidWebView,
            isMobile: this.isMobile,
            performanceMode: this.performanceMode,
            userAgent: navigator.userAgent
        });

        // 应用性能优化
        this.applyPerformanceOptimizations();
        
        // 设置全局标志
        window.webViewOptimizer = this;
        window.isAndroidWebView = this.isAndroidWebView;
        window.performanceMode = this.performanceMode;
    }

    // 应用性能优化
    applyPerformanceOptimizations() {
        if (this.isAndroidWebView) {
            this.applyWebViewOptimizations();
        } else if (this.isMobile) {
            this.applyMobileOptimizations();
        }
    }

    // WebView特殊优化
    applyWebViewOptimizations() {
        // 禁用一些可能导致性能问题的特性
        const style = document.createElement('style');
        style.textContent = `
            /* WebView性能优化 */
            * {
                -webkit-transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                -webkit-perspective: 1000;
            }
            
            /* 减少重绘和回流 */
            .record-images {
                contain: layout style paint;
                will-change: auto;
            }
            
            /* 简化动画 */
            .record-item {
                transition: none !important;
            }
            
            /* 优化图片容器 */
            .record-image-placeholder {
                contain: strict;
                transform: translateZ(0);
            }
            
            /* 减少阴影和渐变 */
            .record-item:hover {
                box-shadow: none !important;
            }
        `;
        document.head.appendChild(style);

        // 设置更保守的图片加载策略
        this.maxImagesPerRecord = 2;
        this.enableImageLazyLoading = true;
        this.useImagePlaceholders = true;
    }

    // 移动端优化
    applyMobileOptimizations() {
        this.maxImagesPerRecord = 4;
        this.enableImageLazyLoading = true;
        this.useImagePlaceholders = false;
    }

    // 检查是否应该使用占位符
    shouldUsePlaceholders() {
        return this.isAndroidWebView || this.useImagePlaceholders;
    }

    // 获取最大图片显示数量
    getMaxImagesPerRecord() {
        return this.maxImagesPerRecord || 6;
    }

    // 创建性能友好的图片元素
    createOptimizedImageElement(imageData, index, recordId) {
        if (this.shouldUsePlaceholders()) {
            return this.createImagePlaceholder(imageData, index, recordId);
        } else {
            return this.createLazyImage(imageData, index);
        }
    }

    // 创建图片占位符
    createImagePlaceholder(imageData, index, recordId) {
        const placeholder = document.createElement('div');
        placeholder.className = 'record-image-placeholder';
        placeholder.dataset.imageData = btoa(JSON.stringify(imageData));
        placeholder.dataset.index = index;
        placeholder.dataset.recordId = recordId;
        
        placeholder.innerHTML = `
            <div class="image-placeholder-content">
                <div class="image-icon">🖼️</div>
                <div class="image-info">图片 ${index + 1}</div>
                <div class="image-size">${this.formatFileSize(imageData.size || 0)}</div>
                <div class="tap-to-load">点击查看</div>
            </div>
        `;
        
        placeholder.addEventListener('click', () => {
            this.loadImageOnDemand(placeholder, imageData);
        });
        
        return placeholder;
    }

    // 创建懒加载图片
    createLazyImage(imageData, index) {
        const container = document.createElement('div');
        container.className = 'record-image lazy-image';
        container.dataset.src = imageData.base64;
        container.dataset.type = imageData.type;
        
        container.innerHTML = `
            <div class="image-loading">加载中...</div>
            <div class="image-overlay">
                <span>查看</span>
            </div>
        `;
        
        container.addEventListener('click', () => {
            if (typeof window.viewImage === 'function') {
                window.viewImage(imageData.base64, imageData.type);
            }
        });
        
        // 使用Intersection Observer进行懒加载
        if (window.imageLazyLoader) {
            window.imageLazyLoader.observe(container);
        }
        
        return container;
    }

    // 按需加载图片
    loadImageOnDemand(placeholder, imageData) {
        placeholder.innerHTML = '<div class="image-loading-spinner">加载中...</div>';
        
        // 延迟加载以避免阻塞UI
        setTimeout(() => {
            if (typeof window.viewImage === 'function') {
                window.viewImage(imageData.base64, imageData.type);
            }
            
            // 更新占位符状态
            placeholder.innerHTML = `
                <div class="image-placeholder-content">
                    <div class="image-icon">✅</div>
                    <div class="image-info">已查看</div>
                    <div class="image-size">${this.formatFileSize(imageData.size || 0)}</div>
                    <div class="tap-to-load">再次查看</div>
                </div>
            `;
        }, 100);
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // 监控性能
    monitorPerformance() {
        if (this.isAndroidWebView) {
            // 监控内存使用
            if ('memory' in performance) {
                const memInfo = performance.memory;
                console.log('内存使用情况:', {
                    used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                });
            }
        }
    }

    // 清理资源
    cleanup() {
        // 清理可能的内存泄漏
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// 页面加载时自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.webViewOptimizer = new WebViewOptimizer();
});

// 导出给其他脚本使用
window.WebViewOptimizer = WebViewOptimizer;