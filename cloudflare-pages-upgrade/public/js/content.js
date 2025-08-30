// 下拉刷新相关变量
let pullToRefreshStartY = 0;
let pullToRefreshCurrentY = 0;
let pullToRefreshThreshold = 80;
let isPulling = false;
let refreshIndicator = null;
let isRefreshing = false;

// 开始刷新动画
function startRefreshAnimation() {
    if (isRefreshing) return;
    isRefreshing = true;

    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
        
        // 直接设置内联样式确保动画工作
        const icon = refreshBtn.querySelector('.icon');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
            icon.style.transform = 'none';
            icon.style.transition = 'none';
        }
        
        // 强制重绘以确保动画立即开始
        refreshBtn.offsetHeight;
    }
}

// 停止刷新动画
function stopRefreshAnimation() {
    isRefreshing = false;

    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        refreshBtn.classList.remove('refreshing');
        refreshBtn.disabled = false;
        
        // 清除内联样式，恢复CSS控制
        const icon = refreshBtn.querySelector('.icon');
        if (icon) {
            icon.style.animation = '';
            icon.style.transform = '';
            icon.style.transition = '';
        }
    }
}

// 创建刷新指示器
function createRefreshIndicator() {
    if (refreshIndicator) return refreshIndicator;

    const textareaContainer = document.querySelector('.textarea-container');
    if (!textareaContainer) return null;

    // 确保容器有相对定位
    if (getComputedStyle(textareaContainer).position === 'static') {
        textareaContainer.style.position = 'relative';
    }

    refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-refresh-indicator';
    refreshIndicator.innerHTML = `
        <div class="refresh-spinner">
            <img src="img/refresh.svg" class="refresh-icon" alt="刷新" width="20" height="20">
        </div>
        <span class="refresh-text">下拉刷新</span>
    `;
    textareaContainer.appendChild(refreshIndicator);
    return refreshIndicator;
}

// 触发刷新
function triggerRefresh() {
    if (isRefreshing) return; // 防止重复刷新

    // 开始刷新动画
    startRefreshAnimation();

    const indicator = createRefreshIndicator();
    if (indicator) {
        indicator.classList.add('refreshing');
        indicator.querySelector('.refresh-text').textContent = '正在刷新...';
    }

    // 刷新当前过滤器的记录
    loadRecords(window.currentFilter || 'cache');

    // 显示刷新提示
    if (typeof showNotification === 'function') {
        showNotification('记录已刷新');
    }
}

// 切换内容展开/收起状态
function toggleContent(id) {
    const contentElement = document.querySelector(`.record-content[data-id="${id}"]`);
    if (!contentElement) return;

    const wrapper = contentElement.parentElement;
    const expandBtn = wrapper.querySelector('.expand-btn');
    const isCollapsed = contentElement.classList.contains('collapsed');

    if (isCollapsed) {
        // 展开内容
        contentElement.classList.remove('collapsed');
        if (expandBtn) {
            expandBtn.textContent = '收起';
        }
    } else {
        // 收起内容
        contentElement.classList.add('collapsed');
        if (expandBtn) {
            expandBtn.textContent = '展开';
        }
    }
}

// 当前过滤器状态
window.currentFilter = 'cache';

// 图片查看功能
function viewImage(base64, type) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-backdrop" onclick="closeImageModal()"></div>
        <div class="image-modal-content">
            <button class="image-modal-close" onclick="closeImageModal()">&times;</button>
            <img src="${base64}" alt="查看图片" />
            <div class="image-modal-actions">
                <button onclick="downloadImage('${base64}', '${type}')" class="download-btn">下载图片</button>
            </div>
        </div>
    `;
    
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

function downloadImage(base64, type) {
    try {
        const link = document.createElement('a');
        link.href = base64;
        link.download = `image_${Date.now()}.${type.split('/')[1] || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showNotification === 'function') {
            showNotification('图片下载已开始');
        }
    } catch (error) {
        console.error('下载图片失败:', error);
        if (typeof showNotification === 'function') {
            showNotification('下载图片失败');
        }
    }
}

// 下载记录中的图片
function downloadRecordImages(recordId, encodedImagesData) {
    try {
        // 解码图片数据
        const imagesData = JSON.parse(decodeURIComponent(escape(atob(encodedImagesData))));
        
        if (!Array.isArray(imagesData) || imagesData.length === 0) {
            if (typeof showNotification === 'function') {
                showNotification('没有找到可下载的图片');
            }
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
                        if (typeof showNotification === 'function') {
                            showNotification(`已开始下载 ${imagesData.length} 张图片`);
                        }
                    }
                }, index * 500); // 每张图片间隔500ms下载，避免浏览器限制
            });
        }
    } catch (error) {
        console.error('下载图片失败:', error);
        if (typeof showNotification === 'function') {
            showNotification('下载图片失败: ' + error.message);
        }
    }
}

// 加载记录
function loadRecords(filter = 'cache') {
    // console.log('loadRecords() 被调用，过滤器:', filter);

    window.currentFilter = filter;

    // 控制批量操作按钮的显示/隐藏
    const batchOperationBtn = document.getElementById('batchOperation');
    if (batchOperationBtn) {
        if (filter === 'archived') {
            // 存档模式下隐藏批量操作按钮
            batchOperationBtn.style.display = 'none';
        } else {
            // 缓存模式下显示批量操作按钮
            batchOperationBtn.style.display = 'flex';
        }
    }

    // 显示加载状态
    const container = document.getElementById('records-container');
    const loadingElement = document.getElementById('records-loading');
    container.style.display = 'none';
    loadingElement.style.display = 'flex';

    // 修复URL路径，确保相对于网站根目录
    const fetchPromise = window.authManager ?
        window.authManager.smartFetch(`/api/records?filter=${filter}`, { method: 'GET' }) :
        fetch(`/api/records?filter=${filter}`);

    fetchPromise
        .then(async response => {
            // console.log('加载记录响应状态:', response.status);

            // 检查响应是否成功
            if (!response.ok) {
                // 尝试获取详细错误信息
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                        console.log('服务器错误详情:', errorData.error);
                    }
                } catch (e) {
                    console.log('无法解析错误响应:', e);
                }

                // 如果是401错误，可能需要重新认证
                if (response.status === 401 && window.authManager) {
                    console.log('认证失败，检查认证状态:', {
                        isAuthenticated: window.authManager.isAuthenticated,
                        hasAuthToken: !!window.authManager.authToken,
                        hasCSRFToken: !!window.authManager.csrfToken,
                        usesCookies: window.authManager.usesCookies
                    });

                    // 检查是否需要重新登录
                    const needsAuth = await window.authManager.checkAuthRequired();
                    if (needsAuth && !window.authManager.isAuthenticated) {
                        console.log('需要重新登录');
                        window.authManager.showAuthModal();
                        return; // 不抛出错误，等待用户重新登录
                    }

                    // 尝试刷新token
                    console.log('尝试刷新认证token...');
                    const refreshed = await window.authManager.refreshCSRFToken();
                    if (refreshed) {
                        console.log('Token刷新成功，重新尝试请求...');
                        // 重新发起请求
                        const retryResponse = await window.authManager.smartFetch(`/api/records?filter=${filter}`, { method: 'GET' });
                        if (retryResponse.ok) {
                            return retryResponse.json();
                        }
                    }
                }

                throw new Error(errorMessage);
            }
            return response.json(); // 直接解析JSON
        })
        .then(data => {
            // 停止刷新动画
            stopRefreshAnimation();

            // 隐藏下拉刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.remove('refreshing');
                refreshIndicator.style.opacity = '0';
                setTimeout(() => {
                    refreshIndicator.style.display = 'none';
                }, 300);
            }

            // 隐藏加载状态
            loadingElement.style.display = 'none';
            container.style.display = 'block';

            // 处理数据
            try {
                // 检测是否为移动设备，使用优化渲染
                if (typeof window.renderRecordsOptimized === 'function' && 
                    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
                    window.renderRecordsOptimized(data);
                    return;
                }
                
                if (data.length === 0) {
                    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">暂无记录</p>';
                } else {
                    let recordsHTML = '<ul class="record-list">';
                    data.forEach(record => {
                        // 对记录内容进行trim处理，去除前后空白字符
                        const trimmedContent = record.content ? record.content.trim() : '';

                        // 处理图片数据
                        let imagesHTML = '';
                        let hasImages = false;
                        if (record.images) {
                            try {
                                const images = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
                                if (Array.isArray(images) && images.length > 0) {
                                    hasImages = true;
                                    imagesHTML = '<div class="record-images">';
                                    images.forEach((img, index) => {
                                        imagesHTML += `
                                            <div class="record-image" onclick="viewImage('${img.base64}', '${img.type}')">
                                                <img src="${img.base64}" alt="图片 ${index + 1}" />
                                                <div class="image-overlay">
                                                    <span>查看</span>
                                                </div>
                                            </div>
                                        `;
                                    });
                                    imagesHTML += '</div>';
                                }
                            } catch (e) {
                                console.error('解析图片数据失败:', e);
                            }
                        }

                        // 使用Base64编码内容，避免特殊字符问题
                        const encodedContent = btoa(unescape(encodeURIComponent(trimmedContent)));

                        // 检查内容是否超过3行（大约60个字符）
                        const isLongContent = trimmedContent.length > 60 || (trimmedContent.match(/\n/g) || []).length > 2;
                        const contentClass = isLongContent ? 'record-content collapsed' : 'record-content';
                        const buttonText = isLongContent ? '展开' : '';

                        // 格式化时间，根据屏幕宽度调整格式
                        const formatTime = (timestamp) => {
                            if (timestamp.length >= 16) {
                                const isMobile = window.innerWidth <= 768;
                                if (isMobile) {
                                    // 手机端：只显示 MM-DD HH:MM
                                    const fullTime = timestamp.substring(0, 16); // YYYY-MM-DD HH:MM
                                    return fullTime.substring(5); // 去掉年份，保留 MM-DD HH:MM
                                } else {
                                    // 桌面端：显示完整时间 YYYY-MM-DD HH:MM
                                    return timestamp.substring(0, 16);
                                }
                            }
                            return timestamp;
                        };

                        // 存档状态 - 检查是否有archived字段
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

                        // 计算实际长度（包含图片）
                        let imageCount = 0;
                        let images = [];
                        if (hasImages && record.images) {
                            try {
                                images = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
                                imageCount = Array.isArray(images) ? images.length : 0;
                            } catch (e) {
                                imageCount = 0;
                            }
                        }
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
                                // 纯图片内容显示下载按钮
                                '<button class="download-btn" onclick="downloadRecordImages(' + record.id + ', \'' + 
                                btoa(unescape(encodeURIComponent(JSON.stringify(images)))) + '\')" title="下载图片">' +
                                '<img src="img/download.svg" class="icon download-icon">' +
                                '<span class="download-text">下载</span>' +
                                '</button>' :
                                // 普通内容显示复制按钮
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

                    // 如果在批量模式下，更新记录项
                    if (document.body.classList.contains('batch-mode')) {
                        updateRecordItemsForBatchMode(true);
                    }
                }
            } catch (e) {
                console.error('数据处理错误:', e);
                console.error('收到的数据:', data);
                container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败: 数据格式错误</p>';
            }
        })
        .catch(error => {
            console.error('加载记录失败:', error);

            // 停止刷新动画
            stopRefreshAnimation();

            // 隐藏下拉刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.remove('refreshing');
                refreshIndicator.style.opacity = '0';
                setTimeout(() => {
                    refreshIndicator.style.display = 'none';
                }, 300);
            }

            // 隐藏加载状态
            loadingElement.style.display = 'none';
            container.style.display = 'block';
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败: ' + error.message + '</p>';
        });
}

// 切换存档状态
function toggleArchive(id, archive) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('archived', archive ? '1' : '0');

    const fetchPromise = window.authManager ?
        window.authManager.smartFetch('/api/records', {
            method: 'PUT',
            body: formData
        }) :
        fetch('/api/records', {
            method: 'PUT',
            body: formData
        });

    fetchPromise
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }

            // 显示成功消息
            if (typeof showNotification === 'function') {
                showNotification(data.message);
            }

            // 重新加载当前过滤器的记录
            loadRecords(window.currentFilter);
        })
        .catch(error => {
            console.error('Error:', error);
            if (typeof showNotification === 'function') {
                showNotification('操作失败: ' + (error.message || '未知错误'));
            }
        });
}

// 检查是否支持存档功能
function checkArchiveSupport() {
    const fetchPromise = window.authManager ?
        window.authManager.smartFetch('/api/records?filter=archived', { method: 'GET' }) :
        fetch('/api/records?filter=archived');

    fetchPromise
        .then(response => response.json())
        .then(data => {
            // 如果存档查询成功，说明支持存档功能
            const archivedTab = document.querySelector('.tab-btn[data-filter="archived"]');
            if (archivedTab) {
                archivedTab.style.display = 'inline-block';
            }
        })
        .catch(error => {
            console.log('不支持存档功能或数据库未升级');
            // 隐藏存档标签
            const archivedTab = document.querySelector('.tab-btn[data-filter="archived"]');
            if (archivedTab) {
                archivedTab.style.display = 'none';
            }
        });
}

// 初始化标签切换功能
document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.dataset.filter;

            // 更新标签状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 控制批量操作按钮的显示/隐藏
            const batchOperationBtn = document.getElementById('batchOperation');
            if (batchOperationBtn) {
                if (filter === 'archived') {
                    // 存档模式下隐藏批量操作按钮
                    batchOperationBtn.style.display = 'none';
                } else {
                    // 缓存模式下显示批量操作按钮
                    batchOperationBtn.style.display = 'flex';
                }
            }

            // 如果正在刷新，先停止动画
            if (isRefreshing) {
                stopRefreshAnimation();
            }

            // 加载对应的记录
            loadRecords(filter);
        });
    });

    // 刷新按钮点击事件
    const refreshBtn = document.getElementById('refreshRecords');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            triggerRefresh();
        });
    }

    // 下拉刷新功能
    let touchStartY = 0;
    let touchCurrentY = 0;
    let isAtTop = false;

    // 检查是否在页面顶部
    function checkIfAtTop() {
        return window.scrollY <= 0;
    }

    // 触摸开始
    document.addEventListener('touchstart', function (e) {
        if (checkIfAtTop()) {
            touchStartY = e.touches[0].clientY;
            isAtTop = true;
        }
    }, { passive: true });

    // 触摸移动
    document.addEventListener('touchmove', function (e) {
        if (!isAtTop) return;

        touchCurrentY = e.touches[0].clientY;
        const pullDistance = touchCurrentY - touchStartY;

        // 只有在页面顶部且向下拉时才处理
        if (checkIfAtTop() && pullDistance > 0) {
            isPulling = true;

            const indicator = createRefreshIndicator();
            if (!indicator) return;

            indicator.style.display = 'flex';

            // 计算拉动进度
            const progress = Math.min(pullDistance / pullToRefreshThreshold, 1);
            indicator.style.opacity = progress;

            // 更新指示器状态
            const refreshIcon = indicator.querySelector('.refresh-icon');
            const refreshText = indicator.querySelector('.refresh-text');

            if (pullDistance >= pullToRefreshThreshold) {
                refreshIcon.style.transform = 'rotate(180deg)';
                refreshText.textContent = '释放刷新';
                indicator.classList.add('ready');
            } else {
                refreshIcon.style.transform = 'rotate(0deg)';
                refreshText.textContent = '下拉刷新';
                indicator.classList.remove('ready');
            }

            // 阻止默认滚动行为
            if (pullDistance > 10) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // 触摸结束
    document.addEventListener('touchend', function (e) {
        if (!isPulling) return;

        const pullDistance = touchCurrentY - touchStartY;
        const indicator = createRefreshIndicator();

        if (pullDistance >= pullToRefreshThreshold) {
            // 触发刷新
            triggerRefresh();
        } else {
            // 隐藏指示器
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 300);
        }

        // 重置状态
        isPulling = false;
        isAtTop = false;
        touchStartY = 0;
        touchCurrentY = 0;
    }, { passive: true });

    // 检查存档功能支持
    setTimeout(() => {
        checkArchiveSupport();
    }, 1000);
});