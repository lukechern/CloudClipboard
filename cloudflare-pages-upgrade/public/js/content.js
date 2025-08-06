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
            expandBtn.textContent = '...展开';
        }
    }
}

// 加载记录
function loadRecords() {
    console.log('loadRecords() 被调用');
    
    // 显示加载状态
    const container = document.getElementById('records-container');
    const loadingElement = document.getElementById('records-loading');
    container.style.display = 'none';
    loadingElement.style.display = 'flex';
    
    // 修复URL路径，确保相对于网站根目录
    const requestConfig = window.authManager ? 
        window.authManager.getRequestConfig() : {};
    fetch('/api/records', requestConfig)
        .then(response => {
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // 直接解析JSON
        })
        .then(data => {
            // 隐藏加载状态
            loadingElement.style.display = 'none';
            container.style.display = 'block';
            
            // 处理数据
            try {
                if (data.length === 0) {
                    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">暂无记录</p>';
                } else {
                    let recordsHTML = '<ul class="record-list">';
                    data.forEach(record => {
                        // 对记录内容进行trim处理，去除前后空白字符
                        const trimmedContent = record.content.trim();
                        
                        // 使用Base64编码内容，避免特殊字符问题
                        const encodedContent = btoa(unescape(encodeURIComponent(trimmedContent)));
                        
                        // 检查内容是否超过3行（大约60个字符）
                        const isLongContent = trimmedContent.length > 60 || (trimmedContent.match(/\n/g) || []).length > 2;
                        const contentClass = isLongContent ? 'record-content collapsed' : 'record-content';
                        const buttonText = isLongContent ? '...展开' : '';
                        
                        recordsHTML += '<li class="record-item">' + 
                            '<input type="checkbox" class="record-checkbox" data-id="' + record.id + '" style="display: none;">' + 
                            '<div class="record-content-wrapper">' + 
                                '<div class="' + contentClass + '" data-id="' + record.id + '">' + 
                                trimmedContent + 
                                '</div>' + 
                                '<div class="record-meta">' + 
                                '长度: ' + record.length + ' | ' + 
                                '时间: ' + record.timestamp + 
                                (isLongContent ? '<button class="expand-btn" onclick="toggleContent(' + record.id + ')">' + buttonText + '</button>' : '') + 
                                '</div>' + 
                            '</div>' + 
                            '<div class="record-actions">' + 
                            '<button class="copy-btn" onclick="copyToClipboard(' + record.id + ', \'\' + encodedContent + 
                            '\')" title="复制">' + 
                            '<img src="img/copy.svg" class="icon copy-icon">' + 
                            '<span class="copy-text">复制</span>' + 
                            '</button>' + 
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

}
