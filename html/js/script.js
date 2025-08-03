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

// 加载记录
function loadRecords() {
    // 修复URL路径，确保相对于网站根目录
    fetch('./index.php?get_records=true')
        .then(response => response.json())
        .then(data => {
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
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('records-container').innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">加载记录失败</p>';
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
    const container = document.querySelector('.container');
    
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