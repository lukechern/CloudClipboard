// 复制到剪贴板功能
function copyToClipboard(id, encodedContent) {
    // 解码内容
    const content = decodeURIComponent(escape(atob(encodedContent)));
    
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
}

// 删除记录功能
function deleteRecord(id) {
    showConfirm('确认删除', '确定要删除这条记录吗？', () => {
        // 发送删除请求到服务器
        fetch('./index.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'delete_id=' + encodeURIComponent(id)
        })
        .then(response => response.text())
        .then(data => {
            // 重新加载记录
            loadRecords();
            showNotification('记录已删除');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('删除失败');
        });
    });
}

// 批量删除记录功能
function batchDeleteRecords(ids) {
    showConfirm('确认删除', `确定要删除这 ${ids.length} 条记录吗？`, () => {
        // 发送批量删除请求到服务器
        fetch('./index.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'batch_delete_ids=' + encodeURIComponent(JSON.stringify(ids))
        })
        .then(response => response.text())
        .then(data => {
            // 退出批量操作模式
            exitBatchMode();
            
            // 重新加载记录
            loadRecords();
            showNotification(`已删除 ${ids.length} 条记录`);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('批量删除失败');
        });
    });
}

// 显示自定义确认对话框
function showConfirm(title, message, onConfirm) {
    // 创建模态对话框元素
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'confirmModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancel" id="cancelBtn">取消</button>
                <button class="btn btn-confirm" id="confirmBtn">确认</button>
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

// 进入批量操作模式
function enterBatchMode() {
    // 添加批量操作模式类
    document.body.classList.add('batch-mode');
    
    // 显示批量工具栏
    const batchToolbar = document.getElementById('batchToolbar');
    if (batchToolbar) {
        batchToolbar.classList.add('show');
    }
    
    // 更新记录项以显示复选框
    updateRecordItemsForBatchMode(true);
}

// 退出批量操作模式
function exitBatchMode() {
    // 移除批量操作模式类
    document.body.classList.remove('batch-mode');
    
    // 隐藏批量工具栏
    const batchToolbar = document.getElementById('batchToolbar');
    if (batchToolbar) {
        batchToolbar.classList.remove('show');
    }
    
    // 更新记录项以隐藏复选框
    updateRecordItemsForBatchMode(false);
}

// 更新记录项以适应批量操作模式
function updateRecordItemsForBatchMode(isBatchMode) {
    const recordItems = document.querySelectorAll('.record-item');
    recordItems.forEach(item => {
        const checkbox = item.querySelector('.record-checkbox');
        const copyBtn = item.querySelector('.copy-btn');
        const deleteBtn = item.querySelector('.delete-btn');
        
        if (isBatchMode) {
            item.classList.add('batch-mode');
            checkbox.style.display = 'block';
            deleteBtn.style.display = 'none';
        } else {
            item.classList.remove('batch-mode');
            checkbox.style.display = 'none';
            deleteBtn.style.display = 'block';
            checkbox.checked = false; // 取消选中
        }
    });
    
    // 更新工具栏计数
    updateBatchToolbarCount();
}

// 更新批量操作工具栏中的选中数量
function updateBatchToolbarCount() {
    const checkboxes = document.querySelectorAll('.record-checkbox:checked');
    const count = checkboxes.length;
    
    const countElement = document.querySelector('.batch-toolbar .count');
    if (countElement) {
        countElement.textContent = `已选择 ${count} 项`;
    }
    
    // 根据选中数量启用/禁用删除按钮
    const deleteBtn = document.querySelector('.batch-toolbar .delete-btn');
    if (deleteBtn) {
        deleteBtn.disabled = count === 0;
    }
}

// 加载记录
function loadRecords() {
    // 修复URL路径，确保相对于网站根目录
    fetch('./index.php?get_records=true')
        .then(response => {
            // 检查响应是否成功
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // 先获取文本内容
        })
        .then(text => {
            // 尝试解析JSON
            try {
                const data = JSON.parse(text);
                const container = document.getElementById('records-container');
                if (data.length === 0) {
                    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">暂无记录</p>';
                } else {
                    let recordsHTML = '<ul class="record-list">';
                    data.forEach(record => {
                        // 对记录内容进行trim处理，去除前后空白字符
                        const trimmedContent = record.content.trim();
                        
                        // 使用Base64编码内容，避免特殊字符问题
                        const encodedContent = btoa(unescape(encodeURIComponent(trimmedContent)));
                        
                        recordsHTML += '<li class="record-item">' +
                            '<div class="record-content">' +
                            trimmedContent +
                            '<div class="record-meta">' +
                            '长度: ' + record.length + ' | ' +
                            '时间: ' + record.timestamp +
                            '</div>' +
                            '</div>' +
                            '<div class="record-actions">' +
                            '<input type="checkbox" class="record-checkbox" data-id="' + record.id + '" style="display: none;">' +
                            '<button class="copy-btn" onclick="copyToClipboard(' + record.id + ', \'' + encodedContent + '\')" title="复制">' +
                            '<span class="icon copy-icon"></span>' +
                            '</button>' +
                            '<button class="delete-btn" onclick="deleteRecord(' + record.id + ')" title="删除">' +
                            '<span class="icon delete-icon"></span>' +
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
                console.error('JSON解析错误:', e);
                console.error('收到的响应:', text);
                document.getElementById('records-container').innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败: 数据格式错误</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('records-container').innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败: ' + error.message + '</p>';
        });
}

// 显示加载状态
function showLoadingState(button) {
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = '<img src="./html/img/spinner.svg" class="spinner" alt="Loading"> 发送中请稍候...';
}

// 恢复按钮状态
function restoreButtonState(button) {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = '发送到云端';
}

// 页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function() {
    // 加载记录
    loadRecords();
    
    // 检查是否有成功消息
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('saved')) {
        showNotification('内容已保存到云端');
    }
    
    // 获取相关元素
    const header = document.querySelector('.header');
    const backToTopBtn = document.getElementById('backToTop');
    const batchOperationBtn = document.getElementById('batchOperation');
    const container = document.querySelector('.container');
    
    // 创建批量操作工具栏
    const batchToolbar = document.createElement('div');
    batchToolbar.id = 'batchToolbar';
    batchToolbar.className = 'batch-toolbar';
    batchToolbar.innerHTML = `
        <div class="actions">
            <button class="complete-btn">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                完成
            </button>
            <span class="count">已选择 0 项</span>
        </div>
        <div class="actions">
            <button class="delete-btn" disabled>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                批量删除
            </button>
        </div>
    `;
    document.body.appendChild(batchToolbar);
    
    // 监听滚动事件
    window.addEventListener('scroll', function() {
        // 获取滚动位置
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 固定标题栏逻辑
        if (scrollTop > header.offsetTop) {
            header.classList.add('header-fixed');
            // 添加顶部边距以防止内容跳动
            container.style.paddingTop = header.offsetHeight + 'px';
        } else {
            header.classList.remove('header-fixed');
            container.style.paddingTop = '0';
        }
        
        // 显示/隐藏回到顶部按钮
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    // 回到顶部按钮点击事件
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 批量操作按钮点击事件
    batchOperationBtn.addEventListener('click', function() {
        enterBatchMode();
    });
    
    // 完成按钮点击事件
    document.querySelector('.batch-toolbar .complete-btn').addEventListener('click', function() {
        exitBatchMode();
    });
    
    // 批量删除按钮点击事件
    document.querySelector('.batch-toolbar .delete-btn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.record-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
        
        if (ids.length > 0) {
            batchDeleteRecords(ids);
        }
    });
    
    // 监听复选框变化以更新计数
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('record-checkbox')) {
            updateBatchToolbarCount();
        }
    });
});

// 处理表单提交
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.input-section form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const textarea = form.querySelector('textarea');
            const submitBtn = form.querySelector('button[type="submit"]');
            
            // 获取表单数据
            const content = textarea.value.trim();
            
            // 验证内容是否为空
            if (!content) {
                showNotification('请输入要保存的内容');
                return;
            }
            
            // 添加加载状态
            if (submitBtn) {
                showLoadingState(submitBtn);
            }
            
            // 创建请求数据
            const formData = new FormData();
            formData.append('content', content);
            
            // 发送请求
            fetch('/CloudClipboard/index.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                return response.text();
            })
            .then(data => {
                // 清空并重新启用表单
                textarea.value = '';
                
                if (submitBtn) {
                    restoreButtonState(submitBtn);
                }
                
                // 重新加载记录
                loadRecords();
                
                // 显示成功消息
                showNotification('内容已保存到云端');
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('保存失败: ' + error.message);
                
                if (submitBtn) {
                    restoreButtonState(submitBtn);
                }
            });
        });
    }
});