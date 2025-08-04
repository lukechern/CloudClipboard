// 显示消息
function showMessage(msg, isSuccess) {
    const container = document.getElementById('message-container');
    if (!container) {
        console.error('Message container not found');
        return;
    }
    container.innerHTML = `
        <div class="message ${isSuccess ? 'success' : 'error'}">
            ${msg}
        </div>
    `;
}

// 页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function() {
    // 加载详细存储信息
    loadStorageDetails();
    
    // 检查表是否存在
    checkTableExists();
    
    // 检查是否有消息需要显示
    if (typeof message !== 'undefined' && typeof success !== 'undefined' && message !== null) {
        showMessage(message, success);
    }

    // 处理表单提交
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
            fetch('./init_db.php', {
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
                    // 如果创建成功，隐藏表单
                    form.style.display = 'none';
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
// 加载详细存储信息
function loadStorageDetails() {
    fetch('./index.php?get_storage_info=1')
        .then(response => response.json())
        .then(data => {
            displayStorageDetails(data);
        })
        .catch(error => {
            console.error('加载存储信息失败:', error);
            // 如果加载失败，显示默认信息
            displayStorageDetails({
                type: '未知',
                location: '未知',
                status: '获取失败'
            });
        });
}

// 显示详细存储信息
function displayStorageDetails(storageInfo) {
    const container = document.getElementById('storage-info-details');
    if (!container) return;
    
    const statusClass = storageInfo.status === '已配置' ? 'configured' : 'not-configured';
    
    let html = `
        <div class="storage-info-item">
            <span class="storage-info-label">存储类型:</span>
            <span class="storage-info-value">${storageInfo.type}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">存储位置:</span>
            <span class="storage-info-value">${storageInfo.location}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">表名:</span>
            <span class="storage-info-value">${storageInfo.table_name || '未知'}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">配置状态:</span>
            <span class="storage-status ${statusClass}">${storageInfo.status}</span>
        </div>
    `;
    
    // 根据存储类型添加额外信息
    if (storageInfo.type && storageInfo.type.includes('Cloudflare D1')) {
        if (storageInfo.account_id) {
            html += `
                <div class="storage-info-item">
                    <span class="storage-info-label">Account ID:</span>
                    <span class="storage-info-value">${storageInfo.account_id}</span>
                </div>
            `;
        }
        if (storageInfo.database_id) {
            html += `
                <div class="storage-info-item">
                    <span class="storage-info-label">Database ID:</span>
                    <span class="storage-info-value">${storageInfo.database_id}</span>
                </div>
            `;
        }
    } else if (storageInfo.type && storageInfo.type.includes('MySQL')) {
        if (storageInfo.host) {
            html += `
                <div class="storage-info-item">
                    <span class="storage-info-label">主机:</span>
                    <span class="storage-info-value">${storageInfo.host}</span>
                </div>
            `;
        }
        if (storageInfo.database) {
            html += `
                <div class="storage-info-item">
                    <span class="storage-info-label">数据库:</span>
                    <span class="storage-info-value">${storageInfo.database}</span>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}
// 检查表是否存在
function checkTableExists() {
    fetch('./index.php?get_records=1')
        .then(response => response.json())
        .then(data => {
            // 如果能成功获取记录，说明表存在
            const form = document.querySelector('.init-form form');
            if (form) {
                // 隐藏表单
                form.style.display = 'none';
                
                // 显示消息
                showMessage('数据表已存在，无需创建', true);
            }
        })
        .catch(error => {
            // 如果获取记录失败，可能表不存在，保持表单显示
            console.log('表可能不存在，保持创建按钮可见');
        });
}