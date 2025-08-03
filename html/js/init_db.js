// 页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function() {
    // 显示配置信息
    if (typeof config !== 'undefined') {
        document.getElementById('account-id').textContent = config.accountId;
        document.getElementById('database-id').textContent = config.databaseId;
        document.getElementById('table-name').textContent = config.tableName;
    }
    
    // 检查是否有消息需要显示
    if (typeof message !== 'undefined' && typeof success !== 'undefined') {
        showMessage(message, success);
    }
});

// 显示消息
function showMessage(msg, isSuccess) {
    const container = document.getElementById('message-container');
    container.innerHTML = `
        <div class="message ${isSuccess ? 'success' : 'error'}">
            ${msg}
        </div>
    `;
}

// 处理表单提交
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.init-form form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 显示加载状态
            const button = form.querySelector('.init-btn');
            const originalText = button.textContent;
            button.textContent = '正在创建...';
            button.disabled = true;
            
            // 发送请求
            fetch('/CloudClipboard/init_db.php', {
                method: 'POST',
                body: new FormData(form)
            })
            .then(response => response.json())
            .then(data => {
                // 恢复按钮状态
                button.textContent = originalText;
                button.disabled = false;
                
                // 显示结果
                if (data.success) {
                    showMessage(data.message, true);
                } else {
                    showMessage(data.message, false);
                }
            })
            .catch(error => {
                // 恢复按钮状态
                button.textContent = originalText;
                button.disabled = false;
                
                // 显示错误
                showMessage('请求失败: ' + error.message, false);
            });
        });
    }
});
