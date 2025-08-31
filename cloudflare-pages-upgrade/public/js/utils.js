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

        // 调试信息：检查图片数据格式
        console.log('准备下载图片，记录ID:', recordId);
        console.log('图片数据:', imagesData);
        
        // 验证图片数据格式
        for (let i = 0; i < imagesData.length; i++) {
            const img = imagesData[i];
            if (!img || !img.base64 || !img.type) {
                console.error(`第 ${i + 1} 张图片数据不完整:`, img);
                showNotification(`第 ${i + 1} 张图片数据不完整，无法下载`);
                return;
            }
        }

        // 如果只有一张图片，直接下载
        if (imagesData.length === 1) {
            const img = imagesData[0];
            console.log('下载单张图片:', img.type, img.base64.substring(0, 50) + '...');
            downloadImage(img.base64, img.type);
        } else {
            // 多张图片，依次下载
            let downloadCount = 0;
            let successCount = 0;
            
            imagesData.forEach((img, index) => {
                setTimeout(() => {
                    try {
                        // 确保 base64 数据格式正确
                        let dataUrl = img.base64;
                        
                        // 如果 base64 数据不包含 data: 前缀，添加它
                        if (!img.base64.startsWith('data:')) {
                            dataUrl = `data:${img.type};base64,${img.base64}`;
                        }
                        
                        // 验证 base64 格式
                        const base64Part = dataUrl.split(',')[1];
                        if (!base64Part) {
                            throw new Error('Invalid base64 format');
                        }
                        
                        // 尝试解码以验证格式
                        atob(base64Part);
                        
                        // 检查是否在Android WebView环境中
                        if (typeof AndroidClipboard !== 'undefined' && AndroidClipboard.downloadDataUrl) {
                            const extension = img.type.split('/')[1] || 'png';
                            const fileName = `image_${recordId}_${index + 1}.${extension}`;
                            AndroidClipboard.downloadDataUrl(dataUrl, fileName);
                        } else {
                            // 使用标准浏览器下载方式
                            const link = document.createElement('a');
                            link.href = dataUrl;
                            const extension = img.type.split('/')[1] || 'png';
                            link.download = `image_${recordId}_${index + 1}.${extension}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                        
                        successCount++;
                    } catch (error) {
                        console.error(`下载第 ${index + 1} 张图片失败:`, error);
                    }
                    
                    downloadCount++;
                    if (downloadCount === imagesData.length) {
                        if (successCount > 0) {
                            showNotification(`已开始下载 ${successCount}/${imagesData.length} 张图片`);
                        } else {
                            showNotification('所有图片下载失败，请检查图片数据');
                        }
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
        console.log('开始下载图片，类型:', type);
        console.log('Base64 数据长度:', base64.length);
        console.log('Base64 前缀:', base64.substring(0, 30));
        
        // 确保 base64 数据格式正确
        let dataUrl = base64;
        
        // 如果 base64 数据不包含 data: 前缀，添加它
        if (!base64.startsWith('data:')) {
            console.log('添加 data: 前缀');
            dataUrl = `data:${type};base64,${base64}`;
        }
        
        // 验证 base64 格式
        try {
            // 提取 base64 部分进行验证
            const base64Part = dataUrl.split(',')[1];
            if (!base64Part) {
                throw new Error('Invalid base64 format: no comma separator found');
            }
            
            console.log('Base64 部分长度:', base64Part.length);
            console.log('Base64 部分前缀:', base64Part.substring(0, 20));
            
            // 检查 base64 字符串是否只包含有效字符
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(base64Part)) {
                throw new Error('Invalid base64 characters found');
            }
            
            // 尝试解码以验证格式
            atob(base64Part);
            console.log('Base64 验证成功');
        } catch (decodeError) {
            console.error('Base64 decode error:', decodeError);
            console.error('问题数据:', {
                originalBase64: base64.substring(0, 100),
                dataUrl: dataUrl.substring(0, 100),
                base64Part: dataUrl.split(',')[1]?.substring(0, 100)
            });
            showNotification('图片数据格式错误，无法下载');
            return;
        }
        
        // 检查是否在Android WebView环境中
        if (typeof AndroidClipboard !== 'undefined' && AndroidClipboard.downloadDataUrl) {
            console.log('使用Android WebView下载接口');
            const fileName = `image_${Date.now()}.${type.split('/')[1] || 'png'}`;
            const success = AndroidClipboard.downloadDataUrl(dataUrl, fileName);
            if (success) {
                showNotification('开始下载图片');
            } else {
                showNotification('下载失败，请重试');
            }
        } else {
            // 使用标准浏览器下载方式
            console.log('使用标准浏览器下载方式');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `image_${Date.now()}.${type.split('/')[1] || 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('图片下载已开始');
        }
    } catch (error) {
        console.error('Download image error:', error);
        showNotification('下载图片失败: ' + error.message);
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
        console.error('Download single image error:', error);
        showNotification('下载图片失败: ' + error.message);
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
function showLoadingState(button, customText_7ree) {
    // 记录按钮原始内容，便于恢复（仅首次记录）_7ree
    if (!button._originalHtml_7ree) {
        button._originalHtml_7ree = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add('loading');
    const loadingText_7ree = typeof customText_7ree === 'string' && customText_7ree.length > 0 ? customText_7ree : '请稍候...';
    button.innerHTML = '<img src="./img/spinner.svg" class="spinner" alt="Loading"> ' + loadingText_7ree;
}

// 恢复按钮状态
function restoreButtonState(button) {
    button.disabled = false;
    button.classList.remove('loading');
    if (button._originalHtml_7ree) {
        // 优先恢复为按钮自身的原始内容 _7ree
        button.innerHTML = button._originalHtml_7ree;
        try { delete button._originalHtml_7ree; } catch (e) { button._originalHtml_7ree = null; }
    } else {
        // 兼容旧逻辑（无记录时回退）_7ree
        button.textContent = '发送到云端';
    }
}

// 确保函数在全局作用域中可用
window.copyToClipboard = copyToClipboard;
window.downloadRecordImages = downloadRecordImages;
window.downloadImage = downloadImage;
window.downloadSingleImage = downloadSingleImage;
window.showConfirm = showConfirm;
window.showNotification = showNotification;
window.showLoadingState = showLoadingState;
window.restoreButtonState = restoreButtonState;

console.log('工具函数模块已加载，相关函数已注册到全局作用域');
