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
    // 监听认证成功事件
    window.addEventListener('authSuccess', function() {
        // console.log('认证成功，加载初始化页面数据');
        loadStorageDetails();
        checkTableExists();
    });
    
    // 延迟检查认证状态
    setTimeout(() => {
        if (!window.authManager || window.authManager.isAuthenticated) {
            // console.log('无需认证或已认证，直接加载数据');
            loadStorageDetails();
            checkTableExists();
        } else {
            console.log('等待认证完成...');
        }
    }, 200);
    
    // 检查是否有消息需要显示
    if (typeof message !== 'undefined' && typeof success !== 'undefined' && message !== null) {
        showMessage(message, success);
    }

    // 处理创建表单提交
    const initForm = document.getElementById('init-form');
    if (initForm) {
        initForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 显示加载状态
            const button = initForm.querySelector('.init-btn');
            const originalText = button.textContent;
            button.textContent = '正在创建...';
            button.disabled = true;
            
            // 发送请求
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST'
                }) : {
                    method: 'POST'
                };
            
            console.log('创建请求配置:', requestConfig);
            console.log('认证管理器状态:', {
                exists: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                hasCSRF: !!window.authManager?.csrfToken,
                usesCookies: window.authManager?.usesCookies
            });
            
            fetch('/api/init', requestConfig)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                // 恢复按钮状态
                button.textContent = originalText;
                button.disabled = false;
                
                // 显示结果
                if (data.success) {
                    showMessage(data.message, true);
                    // 重新检查数据库状态
                    checkTableExists();
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
    
    // 处理升级表单提交
    const upgradeForm = document.getElementById('upgrade-form');
    if (upgradeForm) {
        upgradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 显示加载状态
            const button = upgradeForm.querySelector('.upgrade-btn');
            const originalText = button.textContent;
            button.textContent = '正在升级...';
            button.disabled = true;
            
            // 创建表单数据
            const formData = new FormData();
            formData.append('action', 'upgrade');
            
            // 发送请求
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig({
                    method: 'POST',
                    body: formData
                }) : {
                    method: 'POST',
                    body: formData
                };
            
            console.log('升级请求配置:', requestConfig);
            console.log('认证管理器状态:', {
                exists: !!window.authManager,
                isAuthenticated: window.authManager?.isAuthenticated,
                hasCSRF: !!window.authManager?.csrfToken,
                usesCookies: window.authManager?.usesCookies
            });
            
            fetch('/api/init', requestConfig)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                // 恢复按钮状态
                button.textContent = originalText;
                button.disabled = false;
                
                // 显示结果
                if (data.success) {
                    showMessage(data.message, true);
                    // 重新检查数据库状态
                    checkTableExists();
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
    const requestConfig = window.authManager ? 
        window.authManager.getRequestConfig() : {};
    fetch('/api/storage', requestConfig)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            displayStorageDetails(data);
        })
        .catch(error => {
            console.error('加载存储信息失败:', error);
            // 如果加载失败，显示默认信息
            displayStorageDetails({
                type: 'Cloudflare',
                location: 'D1数据库',
                table_name: 'cloudclipboard',
                status: '获取失败'
            });
        });
}

// 显示详细存储信息
function displayStorageDetails(storageInfo) {
    const container = document.getElementById('storage-info-details');
    if (!container) return;
    
    // 处理可能的undefined值
    const type = storageInfo.type || 'Cloudflare';
    const location = storageInfo.location || 'D1数据库';
    const tableName = storageInfo.table_name || 'cloudclipboard';
    const status = storageInfo.status || '已配置';
    
    const statusClass = status === '已配置' ? 'configured' : 'not-configured';
    
    let html = `
        <div class="storage-info-item">
            <span class="storage-info-label">存储类型:</span>
            <span class="storage-info-value">${type}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">存储位置:</span>
            <span class="storage-info-value">${location}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">表名:</span>
            <span class="storage-info-value">${tableName}</span>
        </div>
        <div class="storage-info-item">
            <span class="storage-info-label">配置状态:</span>
            <span class="storage-status ${statusClass}">${status}</span>
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
// 检查表是否存在和结构完整性
function checkTableExists() {
    const requestConfig = window.authManager ? 
        window.authManager.getRequestConfig() : {};
    fetch('/api/init', requestConfig)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            const statusContainer = document.getElementById('db-status');
            const initForm = document.getElementById('init-form');
            const upgradeForm = document.getElementById('upgrade-form');
            
            if (data.table_exists) {
                if (data.needs_upgrade) {
                    // 表存在但结构不完整
                    statusContainer.innerHTML = `
                        <div class="status-info warning">
                            <h4>数据库结构需要升级</h4>
                            <p>表已存在，但缺少以下字段：${data.missing_columns.join(', ')}</p>
                        </div>
                    `;
                    initForm.style.display = 'none';
                    upgradeForm.style.display = 'block';
                } else {
                    // 表存在且结构完整
                    statusContainer.innerHTML = `
                        <div class="status-info success">
                            <h4>数据库状态正常</h4>
                            <p>数据表已存在且结构完整，无需操作</p>
                        </div>
                    `;
                    initForm.style.display = 'none';
                    upgradeForm.style.display = 'none';
                }
            } else {
                // 表不存在
                statusContainer.innerHTML = `
                    <div class="status-info info">
                        <h4>数据库未初始化</h4>
                        <p>数据表不存在，需要创建</p>
                    </div>
                `;
                initForm.style.display = 'block';
                upgradeForm.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('检查表状态失败:', error);
            const statusContainer = document.getElementById('db-status');
            statusContainer.innerHTML = `
                <div class="status-info error">
                    <h4>检查数据库状态失败</h4>
                    <p>${error.message}</p>
                </div>
            `;
        });
}// 调试函数

function debugAuth() {
    const debugResult = document.getElementById('debug-result');
    const authInfo = {
        authManagerExists: !!window.authManager,
        isAuthenticated: window.authManager?.isAuthenticated,
        hasToken: !!window.authManager?.authToken,
        hasCSRF: !!window.authManager?.csrfToken,
        usesCookies: window.authManager?.usesCookies
    };
    debugResult.innerHTML = '<h5>认证状态:</h5><pre>' + JSON.stringify(authInfo, null, 2) + '</pre>';
}

async function debugUpgrade() {
    const debugResult = document.getElementById('debug-result');
    debugResult.innerHTML = '测试升级中...';
    
    try {
        const formData = new FormData();
        formData.append('action', 'upgrade');
        
        const requestConfig = window.authManager ? 
            window.authManager.getRequestConfig({
                method: 'POST',
                body: formData
            }) : {
                method: 'POST',
                body: formData
            };
        
        console.log('调试升级请求配置:', requestConfig);
        
        const response = await fetch('/api/init', requestConfig);
        const data = await response.json();
        
        if (response.ok) {
            debugResult.innerHTML = '<h5>升级成功:</h5><pre style="color: green;">' + JSON.stringify(data, null, 2) + '</pre>';
            // 重新检查数据库状态
            checkTableExists();
        } else {
            debugResult.innerHTML = '<h5>升级失败 (' + response.status + '):</h5><pre style="color: red;">' + JSON.stringify(data, null, 2) + '</pre>';
        }
    } catch (error) {
        debugResult.innerHTML = '<h5>升级错误:</h5><pre style="color: red;">' + error.message + '</pre>';
    }
}

// 显示调试区域（如果需要）
document.addEventListener('DOMContentLoaded', function() {
    // 如果URL包含debug参数，显示调试区域
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
        const debugSection = document.getElementById('debug-section');
        if (debugSection) {
            debugSection.style.display = 'block';
        }
    }
});