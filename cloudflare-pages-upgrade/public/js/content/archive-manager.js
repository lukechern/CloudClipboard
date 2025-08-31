// 存档功能模块

// 切换存档状态
function toggleArchive(id, archive) {
    console.log('toggleArchive 被调用，ID:', id, '存档状态:', archive);
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
        .then(() => {
            // 如果存档查询成功，说明支持存档功能
            const archivedTab = document.querySelector('.tab-btn[data-filter="archived"]');
            if (archivedTab) {
                archivedTab.style.display = 'inline-block';
            }
        })
        .catch(() => {
            console.log('不支持存档功能或数据库未升级');
            // 隐藏存档标签
            const archivedTab = document.querySelector('.tab-btn[data-filter="archived"]');
            if (archivedTab) {
                archivedTab.style.display = 'none';
            }
        });
}

// 确保函数在全局作用域中可用
window.toggleArchive = toggleArchive;
window.checkArchiveSupport = checkArchiveSupport;

console.log('存档管理模块已加载，toggleArchive函数已注册到全局作用域');