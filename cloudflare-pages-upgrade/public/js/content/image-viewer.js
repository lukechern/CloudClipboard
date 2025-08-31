// 图片查看功能模块

// 图片查看功能
function viewImage(recordId, imageIndex) {
    try {
        console.log('用户点击缩略图，立即显示加载模态框');

        // 立即创建并显示加载状态的模态框
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop"></div>
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <div class="image-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; min-height: 200px; background: white;">
                    <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #705DBC; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                    <div class="loading-text" style="color: #666; font-size: 16px; font-weight: 500; text-align: center;">载入中，请稍候…</div>
                </div>
            </div>
        `;

        // 确保spin动画可用
        if (!document.querySelector('#spin-animation-style')) {
            const style = document.createElement('style');
            style.id = 'spin-animation-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // 添加基本事件监听器
        modal.querySelector('.image-modal-backdrop').addEventListener('click', closeImageModal);
        modal.querySelector('.image-modal-close').addEventListener('click', closeImageModal);

        // 立即将模态框添加到文档并处理页面滚动
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

        console.log('加载模态框已显示，开始获取图片数据');

        // 现在开始获取图片数据
        setTimeout(async () => {
            let recordIdInt_7ree = parseInt(recordId);
            let recordData_7ree = window.recordsData ? window.recordsData.get(recordIdInt_7ree) : null;
            let imgData_7ree = recordData_7ree && recordData_7ree.images && recordData_7ree.images[imageIndex];

            // 若本地无完整图片数据，先异步按需加载（保持模态框已显示）
            if (!imgData_7ree || !imgData_7ree.base64) {
                try {
                    if (typeof window.ensureFullImageData_7ree === 'function') {
                        await window.ensureFullImageData_7ree(recordIdInt_7ree);
                        // 重新读取数据
                        recordData_7ree = window.recordsData ? window.recordsData.get(recordIdInt_7ree) : null;
                        imgData_7ree = recordData_7ree && recordData_7ree.images && recordData_7ree.images[imageIndex];
                    }
                } catch (e) {
                    console.error('ensureFullImageData_7ree 调用失败:', e);
                }
            }

            if (!imgData_7ree || !imgData_7ree.base64) {
                showNotification('图片不存在');
                closeImageModal();
                return;
            }

            const base64 = imgData_7ree.base64;

            console.log('获取到图片数据，开始预加载');

            // 预加载图片
            const imageElement = new Image();
            const startTime = Date.now();
            const minLoadingTime = 800; // 最小显示800ms的加载状态，让用户能看到

            imageElement.onload = function () {
                console.log('图片预加载完成');
                const loadTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - loadTime);

                // 确保加载状态至少显示足够时间
                setTimeout(() => {
                    // 如果用户已关闭模态框，则不再渲染
                    const modalCurrent_7ree = document.querySelector('.image-modal');
                    if (!modalCurrent_7ree) return;

                    console.log('替换为实际图片');
                    const modalContent = modalCurrent_7ree.querySelector('.image-modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = `
                            <button class="image-modal-close">&times;</button>
                            <img src="${base64}" alt="查看图片" />
                            <div class="image-modal-actions">
                                <button class="download-single-btn" data-record-id="${recordIdInt_7ree}" data-image-index="${imageIndex}">下载图片</button>
                            </div>
                        `;

                        // 重新绑定事件监听器
                        modalContent.querySelector('.image-modal-close').addEventListener('click', closeImageModal);
                        modalContent.querySelector('.download-single-btn').addEventListener('click', function () {
                            downloadSingleImage(recordIdInt_7ree, imageIndex);
                        });
                    }
                }, remainingTime);
            };

            imageElement.onerror = function () {
                console.log('图片加载失败');
                showNotification('图片加载失败');
                closeImageModal();
            };

            // 开始预加载图片
            imageElement.src = base64;

        }, 50); // 给一点时间让模态框先显示

    } catch (error) {
        console.error('viewImage error:', error);
        showNotification('无法查看图片');
        return;
    }
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