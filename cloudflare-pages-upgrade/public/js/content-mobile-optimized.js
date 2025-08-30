// 移动端优化的内容处理脚本
// 主要解决安卓WebView中图片加载卡顿问题

// 检测是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检测是否为安卓WebView
function isAndroidWebView() {
    const ua = navigator.userAgent;
    return ua.includes('Android') && (ua.includes('wv') || ua.includes('Version/'));
}

// 图片懒加载管理器
class ImageLazyLoader {
    constructor() {
        this.imageCache = new Map();
        this.observer = null;
        this.init();
    }

    init() {
        // 创建Intersection Observer用于懒加载
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }

    // 创建图片占位符
    createImagePlaceholder(imageData, index) {
        const isMobile = isMobileDevice();
        const isAndroid = isAndroidWebView();
        
        // 在安卓WebView中使用更简单的占位符
        if (isAndroid) {
            return `
                <div class="record-image-placeholder" 
                     data-image-data="${btoa(JSON.stringify(imageData))}" 
                     data-index="${index}"
                     onclick="loadAndViewImage(this)">
                    <div class="image-placeholder-content">
                        <div class="image-icon">🖼️</div>
                        <div class="image-info">图片 ${index + 1}</div>
                        <div class="image-size">${this.formatFileSize(imageData.size || 0)}</div>
                        <div class="tap-to-load">点击查看</div>
                    </div>
                </div>
            `;
        } else {
            // 桌面端和其他移动端使用缩略图
            return `
                <div class="record-image lazy-image" 
                     data-src="${imageData.base64}" 
                     data-type="${imageData.type}"
                     onclick="viewImage('${imageData.base64}', '${imageData.type}')">
                    <div class="image-loading">加载中...</div>
                    <div class="image-overlay">
                        <span>查看</span>
                    </div>
                </div>
            `;
        }
    }

    // 加载图片
    loadImage(element) {
        const src = element.dataset.src;
        if (src && !element.querySelector('img')) {
            const img = document.createElement('img');
            img.onload = () => {
                element.querySelector('.image-loading').style.display = 'none';
                element.appendChild(img);
            };
            img.onerror = () => {
                element.querySelector('.image-loading').textContent = '加载失败';
            };
            img.src = src;
            img.alt = `图片`;
        }
    }

    // 观察懒加载元素
    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        } else {
            // 如果不支持IntersectionObserver，直接加载
            this.loadImage(element);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// 全局图片懒加载器
window.imageLazyLoader = new ImageLazyLoader();

// 优化的记录渲染函数
function renderRecordsOptimized(data) {
    const container = document.getElementById('records-container');
    const optimizer = window.webViewOptimizer;
    const isMobile = optimizer ? optimizer.isMobile : isMobileDevice();
    const isAndroid = optimizer ? optimizer.isAndroidWebView : isAndroidWebView();
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">暂无记录</p>';
        return;
    }

    let recordsHTML = '<ul class="record-list">';
    
    data.forEach(record => {
        const trimmedContent = record.content ? record.content.trim() : '';

        // 处理图片数据 - 移动端优化
        let imagesHTML = '';
        let hasImages = false;
        let images = [];
        
        if (record.images) {
            try {
                images = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
                if (Array.isArray(images) && images.length > 0) {
                    hasImages = true;
                    imagesHTML = '<div class="record-images">';
                    
                    // 限制显示的图片数量（移动端）
                    const maxImages = optimizer ? optimizer.getMaxImagesPerRecord() : (isAndroid ? 3 : images.length);
                    const displayImages = images.slice(0, maxImages);
                    
                    displayImages.forEach((img, index) => {
                        if (optimizer) {
                            const imgElement = optimizer.createOptimizedImageElement(img, index, record.id);
                            imagesHTML += imgElement.outerHTML;
                        } else {
                            imagesHTML += window.imageLazyLoader.createImagePlaceholder(img, index);
                        }
                    });
                    
                    // 如果有更多图片，显示提示
                    if (images.length > maxImages) {
                        imagesHTML += `
                            <div class="more-images-indicator">
                                +${images.length - maxImages} 张图片
                            </div>
                        `;
                    }
                    
                    imagesHTML += '</div>';
                }
            } catch (e) {
                console.error('解析图片数据失败:', e);
            }
        }

        // 使用Base64编码内容，避免特殊字符问题
        const encodedContent = btoa(unescape(encodeURIComponent(trimmedContent)));

        // 检查内容是否超过3行（移动端优化）
        const maxLength = isMobile ? 40 : 60;
        const isLongContent = trimmedContent.length > maxLength || (trimmedContent.match(/\n/g) || []).length > 2;
        const contentClass = isLongContent ? 'record-content collapsed' : 'record-content';
        const buttonText = isLongContent ? '展开' : '';

        // 格式化时间
        const formatTime = (timestamp) => {
            if (timestamp.length >= 16) {
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    return timestamp.substring(5, 16); // MM-DD HH:MM
                } else {
                    return timestamp.substring(0, 16); // YYYY-MM-DD HH:MM
                }
            }
            return timestamp;
        };

        // 存档状态
        const hasArchivedField = record.hasOwnProperty('archived');
        const isArchived = hasArchivedField && record.archived === 1;
        const starIcon = isArchived ? 'star-filled.svg' : 'star-outline.svg';
        const starTitle = isArchived ? '移出存档' : '移入存档';
        const starText = isArchived ? '移出存档' : '移入存档';

        // 构建内容区域
        let contentHTML = '';
        if (trimmedContent) {
            contentHTML += trimmedContent;
        }
        if (hasImages) {
            contentHTML += imagesHTML;
        }

        // 计算实际长度
        const imageCount = images.length;
        const actualLength = record.length || (trimmedContent.length + (imageCount * 50));

        // 检查是否是纯图片内容
        const isPureImageContent = trimmedContent.startsWith('[图片内容]') && hasImages;

        recordsHTML += '<li class="record-item">' +
            '<input type="checkbox" class="record-checkbox" data-id="' + record.id + '" style="display: none;">' +
            '<div class="record-content-wrapper">' +
            '<div class="' + contentClass + '" data-id="' + record.id + '">' +
            contentHTML +
            '</div>' +
            '<div class="record-meta">' +
            '<span class="meta-item">' +
            '<img src="img/length.svg" class="meta-icon" width="14" height="14" title="长度">' +
            actualLength +
            '</span>' +
            (hasImages ? 
                '<span class="meta-item">' +
                '<img src="img/image.svg" class="meta-icon" width="14" height="14" title="图片数量">' +
                imageCount + '张图片' +
                '</span>' : '') +
            '<span class="meta-item">' +
            '<img src="img/time.svg" class="meta-icon" width="14" height="14" title="时间">' +
            formatTime(record.timestamp) +
            '</span>' +
            (hasArchivedField ?
                '<button class="archive-btn" onclick="toggleArchive(' + record.id + ', ' + (isArchived ? 'false' : 'true') + ')" title="' + starTitle + '">' +
                '<img src="img/' + starIcon + '" class="icon archive-icon" width="16" height="16">' +
                '<span class="archive-text">' + starText + '</span>' +
                '</button>' : '') +
            (isLongContent ? '<button class="expand-btn" onclick="toggleContent(' + record.id + ')">' + buttonText + '</button>' : '') +
            '</div>' +
            '</div>' +
            '<div class="record-actions">' +
            (isPureImageContent ? 
                '<button class="download-btn" onclick="downloadRecordImages(' + record.id + ', \'' + 
                btoa(unescape(encodeURIComponent(JSON.stringify(images)))) + '\')" title="下载图片">' +
                '<img src="img/download.svg" class="icon download-icon">' +
                '<span class="download-text">下载</span>' +
                '</button>' :
                '<button class="copy-btn" onclick="copyToClipboard(' + record.id + ', \'' + encodedContent +
                '\')" title="复制">' +
                '<img src="img/copy.svg" class="icon copy-icon">' +
                '<span class="copy-text">复制</span>' +
                '</button>'
            ) +
            '</div>' +
            '</li>';
    });
    
    recordsHTML += '</ul>';
    container.innerHTML = recordsHTML;

    // 初始化懒加载
    if (!isAndroid) {
        const lazyImages = container.querySelectorAll('.lazy-image');
        lazyImages.forEach(img => {
            window.imageLazyLoader.observe(img);
        });
    }

    // 如果在批量模式下，更新记录项
    if (document.body.classList.contains('batch-mode')) {
        updateRecordItemsForBatchMode(true);
    }
}

// 安卓WebView专用的图片加载函数
function loadAndViewImage(element) {
    const imageDataStr = element.dataset.imageData;
    const index = parseInt(element.dataset.index);
    
    try {
        const imageData = JSON.parse(atob(imageDataStr));
        
        // 显示加载状态
        element.innerHTML = '<div class="image-loading-spinner">加载中...</div>';
        
        // 延迟加载图片以避免阻塞UI
        setTimeout(() => {
            viewImage(imageData.base64, imageData.type);
            
            // 恢复原始内容
            element.innerHTML = `
                <div class="image-placeholder-content">
                    <div class="image-icon">✅</div>
                    <div class="image-info">图片 ${index + 1}</div>
                    <div class="image-size">${window.imageLazyLoader.formatFileSize(imageData.size || 0)}</div>
                    <div class="tap-to-load">已查看</div>
                </div>
            `;
        }, 100);
        
    } catch (error) {
        console.error('加载图片失败:', error);
        element.innerHTML = '<div class="image-error">加载失败</div>';
    }
}

// 导出优化函数供主脚本使用
window.renderRecordsOptimized = renderRecordsOptimized;
window.loadAndViewImage = loadAndViewImage;