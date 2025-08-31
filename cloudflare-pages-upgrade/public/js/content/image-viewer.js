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
            <div class="image-modal-backdrop" onclick="closeImageModal()"></div>
            <div class="image-modal-content">
                <button class="image-modal-close" onclick="closeImageModal()">&times;</button>
                <img src="${base64}" alt="查看图片" />
                <div class="image-modal-actions">
                    <button onclick="downloadSingleImage(${recordId}, ${imageIndex})" class="download-btn">下载图片</button>
                </div>
            </div>
        `;
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