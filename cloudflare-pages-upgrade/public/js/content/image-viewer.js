// 图片查看功能模块

// 图片查看功能
function viewImage(recordId, imageIndex) {
    try {
        // 从全局存储中获取图片数据
        const recordData = window.recordsData.get(recordId);
        if (!recordData || !recordData.images || !recordData.images[imageIndex]) {
            showNotification('图片不存在');
            return;
        }
        
        const img = recordData.images[imageIndex];
        const base64 = img.base64;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop"></div>
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <img src="${base64}" alt="查看图片" />
                <div class="image-modal-actions">
                    <button class="download-single-btn" data-record-id="${recordId}" data-image-index="${imageIndex}">下载图片</button>
                </div>
            </div>
        `;
        
        // 添加事件监听器
        modal.querySelector('.image-modal-backdrop').addEventListener('click', closeImageModal);
        modal.querySelector('.image-modal-close').addEventListener('click', closeImageModal);
        modal.querySelector('.download-single-btn').addEventListener('click', function() {
            downloadSingleImage(recordId, imageIndex);
        });
    } catch (error) {
        showNotification('无法查看图片');
        return;
    }

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // 添加ESC键关闭功能
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// 确保函数在全局作用域中可用
window.viewImage = viewImage;
window.closeImageModal = closeImageModal;

console.log('图片查看模块已加载，相关函数已注册到全局作用域');