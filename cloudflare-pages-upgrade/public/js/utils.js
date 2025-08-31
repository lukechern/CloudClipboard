// 复制到剪贴板功能
function copyToClipboard(recordId) {
    try {
        // 从全局存储中获取内容
        const recordData = window.recordsData.get(recordId);
        if (!recordData || !recordData.content) {
            showNotification('复制失败：内容不存在');
            return;
        }
        
        const content = recordData.content;
        
        // 创建临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        
        // 执行复制
        try {
            document.execCommand('copy');
            showNotification('已复制到剪贴板');
        } catch (err) {
            showNotification('复制失败');
        }
        
        // 移除临时元素
        document.body.removeChild(textArea);
    } catch (error) {
        showNotification('复制失败');
    }
}

// 下载记录中的图片
function downloadRecordImages(recordId) {
    try {
        // 从全局存储中获取图片数据
        const recordData = window.recordsData.get(recordId);
        if (!recordData || !recordData.images) {
            showNotification('没有找到可下载的图片');
            return;
        }

        const imagesData = recordData.images;
        
        if (!Array.isArray(imagesData) || imagesData.length === 0) {
            showNotification('没有找到可下载的图片');
            return;
        }

        // 如果只有一张图片，直接下载
        if (imagesData.length === 1) {
            const img = imagesData[0];
            downloadImage(img.base64, img.type);
        } else {
            // 多张图片，依次下载
            let downloadCount = 0;
            imagesData.forEach((img, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = img.base64;
                    const extension = img.type.split('/')[1] || 'png';
                    link.download = `image_${recordId}_${index + 1}.${extension}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    downloadCount++;
                    if (downloadCount === imagesData.length) {
                        showNotification(`已开始下载 ${imagesData.length} 张图片`);
                    }
                }, index * 500); // 每张图片间隔500ms下载，避免浏览器限制
            });
        }
    } catch (error) {
        showNotification('下载图片失败');
    }
}

// 下载单张图片的辅助函数
function downloadImage(base64, type) {
    try {
        const link = document.createElement('a');
        link.href = base64;
        link.download = `image_${Date.now()}.${type.split('/')[1] || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('图片下载已开始');
    } catch (error) {
        showNotification('下载图片失败');
    }
}

// 从记录中下载单张图片
function downloadSingleImage(recordId, imageIndex) {
    try {
        const recordData = window.recordsData.get(recordId);
        if (!recordData || !recordData.images || !recordData.images[imageIndex]) {
            showNotification('图片不存在');
            return;
        }
        
        const img = recordData.images[imageIndex];
        downloadImage(img.base64, img.type);
    } catch (error) {
        showNotification('下载图片失败');
    }
}

// 显示自定义确认对话框
function showConfirm(title, message, onConfirm, options = {}) {
    // 创建模态对话框元素
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'confirmModal';
    
    // 根据类型设置不同的样式类
    const type = options.type || 'default';
    const modalContentClass = type === 'logout' ? 'modal-content modal-logout' : 'modal-content';
    const confirmBtnClass = type === 'logout' ? 'btn btn-confirm btn-logout' : 'btn btn-confirm';
    const confirmText = options.confirmText || '确认';
    const cancelText = options.cancelText || '取消';
    
    // 为退出登录添加图标
    const titleWithIcon = type === 'logout' ? `⚠️ ${title}` : title;
    
    modal.innerHTML = `
        <div class="${modalContentClass}">
            <div class="modal-header">
                <h3>${titleWithIcon}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancel" id="cancelBtn">${cancelText}</button>
                <button class="${confirmBtnClass}" id="confirmBtn">${confirmText}</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 添加事件监听器
    document.getElementById('confirmBtn').addEventListener('click', function() {
        onConfirm();
        document.body.removeChild(modal);
    });
    
    document.getElementById('cancelBtn').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 显示通知
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
        }
    }, 2000);
}

// 显示加载状态
function showLoadingState(button) {
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = '<img src="./img/spinner.svg" class="spinner" alt="Loading"> 发送中请稍候...';
}

// 恢复按钮状态
function restoreButtonState(button) {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = '发送到云端';
}
