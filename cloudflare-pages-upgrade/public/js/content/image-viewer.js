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
                <div class="image-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">载入中，请稍候…</div>
                </div>
            </div>
        `;

        // 确保spin动画可用（与全局样式互不冲突）
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
            // 支持直接传入 base64 dataURL 的场景（如本地预览点击）_7ree
            const isDataUrl_7ree = typeof recordId === 'string' && recordId.startsWith('data:image');
            if (isDataUrl_7ree) {
                const base64_7ree = recordId;
                const imageElement_7ree = new Image();
                const startTime_7ree = Date.now();
                const minLoadingTime_7ree = 500;
                imageElement_7ree.onload = function () {
                    const loadTime_7ree = Date.now() - startTime_7ree;
                    const remainingTime_7ree = Math.max(0, minLoadingTime_7ree - loadTime_7ree);
                    setTimeout(() => {
                        const modalCurrent_7ree = document.querySelector('.image-modal');
                        if (!modalCurrent_7ree) return;
                        const modalContent_7ree = modalCurrent_7ree.querySelector('.image-modal-content');
                        if (modalContent_7ree) {
                            modalContent_7ree.innerHTML = `
                                <button class="image-modal-close">&times;</button>
                                <img src="${base64_7ree}" alt="查看图片" />
                            `;
                            modalContent_7ree.querySelector('.image-modal-close').addEventListener('click', closeImageModal);
                        }
                    }, remainingTime_7ree);
                };
                imageElement_7ree.onerror = function () {
                    showNotification('图片加载失败');
                    closeImageModal();
                };
                imageElement_7ree.src = base64_7ree;
                return;
            }

            // 数字ID路径：优先直接展示缩略图；下载按钮才加载原图 _7ree
            let recordIdInt_7ree = parseInt(recordId);
            let recordData_7ree = window.recordsData ? window.recordsData.get(recordIdInt_7ree) : null;
            let imgData_7ree = recordData_7ree && recordData_7ree.images && recordData_7ree.images[imageIndex];
            let thumbData_7ree = recordData_7ree && recordData_7ree.thumbnails && recordData_7ree.thumbnails[imageIndex];

            if (thumbData_7ree && thumbData_7ree.base64) {
                console.log('使用缩略图直接展示，等待短暂加载态');
                const imgThumb_7ree = new Image();
                const startTimeThumb_7ree = Date.now();
                const minLoadingTimeThumb_7ree = 200; // 缩略图展示前保留短暂加载态 _7ree
                imgThumb_7ree.onload = function () {
                    const loadTimeThumb_7ree = Date.now() - startTimeThumb_7ree;
                    const remainingThumb_7ree = Math.max(0, minLoadingTimeThumb_7ree - loadTimeThumb_7ree);
                    setTimeout(() => {
                        const modalCurrent_7ree = document.querySelector('.image-modal');
                        if (!modalCurrent_7ree) return;
                        const modalContent_7ree = modalCurrent_7ree.querySelector('.image-modal-content');
                        if (!modalContent_7ree) return;

                        modalContent_7ree.innerHTML = `
                            <button class="image-modal-close">&times;</button>
                            <img src="${thumbData_7ree.base64}" alt="查看图片(缩略图)" />
                            <div class="image-modal-actions">
                                <button class="download-origin-btn_7ree" data-record-id="${recordIdInt_7ree}" data-image-index="${imageIndex}">下载原图</button>
                            </div>
                        `;

                        // 重新绑定事件监听器
                        modalContent_7ree.querySelector('.image-modal-close').addEventListener('click', closeImageModal);
                        const downloadBtn_7ree = modalContent_7ree.querySelector('.download-origin-btn_7ree');
                        if (downloadBtn_7ree) {
                            downloadBtn_7ree.addEventListener('click', async function (e) {
                                e.preventDefault();
                                try {
                                    if (typeof showLoadingState === 'function') {
                                        showLoadingState(downloadBtn_7ree, '下载中...');
                                    }
                                    // 按需加载完整图片数据 _7ree
                                    if (typeof window.ensureFullImageData_7ree === 'function') {
                                        const ok_7ree = await window.ensureFullImageData_7ree(recordIdInt_7ree);
                                        if (!ok_7ree) {
                                            throw new Error('完整图片数据加载失败');
                                        }
                                    }
                                    // 触发下载原图
                                    if (typeof downloadSingleImage === 'function') {
                                        downloadSingleImage(recordIdInt_7ree, imageIndex);
                                    } else {
                                        throw new Error('下载函数不存在');
                                    }
                                } catch (err) {
                                    console.error('下载原图失败:', err);
                                    if (typeof showNotification === 'function') {
                                        showNotification('下载失败');
                                    }
                                } finally {
                                    if (typeof restoreButtonState === 'function') {
                                        restoreButtonState(downloadBtn_7ree);
                                    }
                                }
                            });
                        }
                    }, remainingThumb_7ree);
                };
                imgThumb_7ree.onerror = function () {
                    console.warn('缩略图加载失败，回退到原有逻辑');
                    // fallthrough 到原有逻辑
                    proceedFullImageFlow_7ree();
                };
                imgThumb_7ree.src = thumbData_7ree.base64;
                return; // 已处理缩略图路径 _7ree
            }

            // 无缩略图或不可用时，回退到原有逻辑（按需加载大图并展示）_7ree
            proceedFullImageFlow_7ree();

            function proceedFullImageFlow_7ree() {
                (async () => {
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
                })();
            }

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