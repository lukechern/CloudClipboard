// 记录加载功能模块

// 当前过滤器状态
window.currentFilter = 'cache';

// 全局记录数据存储，避免在DOM中传递长参数
window.recordsData = new Map();

// 加载记录
function loadRecords(filter = 'cache') {
    // 清空之前的记录数据存储
    window.recordsData.clear();

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
            console.log('记录加载成功，数据长度:', data?.length || 0);

            // 停止刷新动画
            stopRefreshAnimation();

            // 隐藏下拉刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.remove('refreshing');
                refreshIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (refreshIndicator) {
                        refreshIndicator.style.display = 'none';
                    }
                }, 300);
            }

            // 隐藏加载状态
            loadingElement.style.display = 'none';
            container.style.display = 'block';

            // 显示加载完成的通知
            if (typeof showNotification === 'function') {
                showNotification('记录已刷新');
            }

            // 处理数据
            try {
                if (data.length === 0) {
                    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">暂无记录</p>';
                } else {
                    renderRecords(data, container);
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
                    if (refreshIndicator) {
                        refreshIndicator.style.display = 'none';
                    }
                }, 300);
            }

            // 隐藏加载状态
            loadingElement.style.display = 'none';
            container.style.display = 'block';
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败: ' + error.message + '</p>';

            // 显示错误通知
            if (typeof showNotification === 'function') {
                showNotification('加载失败: ' + error.message);
            }
        });
}

// 渲染记录列表
function renderRecords(data, container) {
    let recordsHTML = '<ul class="record-list">';
    data.forEach(record => {
        // 对记录内容进行trim处理，去除前后空白字符
        const trimmedContent = record.content ? record.content.trim() : '';

        // 处理图片数据
        let imagesHTML = '';
        let hasImages = false;
        let images = [];
        let thumbnails = [];

        if (record.images) {
            try {
                images = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
                // 尝试获取缩略图数据
                if (record.thumbnails) {
                    thumbnails = typeof record.thumbnails === 'string' ? JSON.parse(record.thumbnails) : record.thumbnails;
                }

                if (Array.isArray(images) && images.length > 0) {
                    hasImages = true;
                    imagesHTML = '<div class="record-images">';
                    images.forEach((img, index) => {
                        // 优先使用缩略图，如果没有则使用原图
                        const displayImage = (thumbnails[index] && thumbnails[index].base64) ?
                            thumbnails[index].base64 : img.base64;

                        imagesHTML += `
                            <div class="record-image" onclick="viewImage(${record.id}, ${index})">
                                <img src="${displayImage}" alt="图片 ${index + 1}" />
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

        // 将记录数据存储到全局变量中
        window.recordsData.set(record.id, {
            content: trimmedContent,
            images: images,
            thumbnails: thumbnails,
            hasImages: hasImages
        });

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
        if (hasImages && images) {
            imageCount = Array.isArray(images) ? images.length : 0;
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
                '<button class="download-btn" onclick="downloadRecordImages(' + record.id + ')" title="下载图片">' +
                '<img src="img/download.svg" class="icon download-icon">' +
                '<span class="download-text">下载</span>' +
                '</button>' :
                // 普通内容显示复制按钮
                '<button class="copy-btn" onclick="copyToClipboard(' + record.id + ')" title="复制">' +
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