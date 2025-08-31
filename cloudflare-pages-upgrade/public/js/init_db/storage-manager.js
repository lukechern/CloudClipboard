// 存储信息管理和显示功能
class StorageManager {
    constructor() {
        // 存储类型配置
        this.storageTypes = {
            'Cloudflare D1': {
                fields: ['account_id', 'database_id'],
                labels: {
                    'account_id': 'Account ID',
                    'database_id': 'Database ID'
                }
            },
            'MySQL': {
                fields: ['host', 'database'],
                labels: {
                    'host': '主机',
                    'database': '数据库'
                }
            }
        };
    }

    // 加载详细存储信息
    async loadStorageDetails() {
        try {
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig() : {};
            
            const response = await fetch('/api/storage', requestConfig);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayStorageDetails(data);
            return data;
            
        } catch (error) {
            console.error('加载存储信息失败:', error);
            // 如果加载失败，显示默认信息
            this.displayStorageDetails({
                type: 'Cloudflare',
                location: 'D1数据库',
                table_name: 'cloudclipboard',
                status: '获取失败'
            });
            throw error;
        }
    }

    // 显示详细存储信息
    displayStorageDetails(storageInfo) {
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
        html += this.generateTypeSpecificInfo(storageInfo);
        
        container.innerHTML = html;
    }

    // 生成特定存储类型的信息
    generateTypeSpecificInfo(storageInfo) {
        let html = '';
        
        // 检查是否是Cloudflare D1
        if (storageInfo.type && storageInfo.type.includes('Cloudflare D1')) {
            const config = this.storageTypes['Cloudflare D1'];
            config.fields.forEach(field => {
                if (storageInfo[field]) {
                    html += `
                        <div class="storage-info-item">
                            <span class="storage-info-label">${config.labels[field]}:</span>
                            <span class="storage-info-value">${storageInfo[field]}</span>
                        </div>
                    `;
                }
            });
        }
        // 检查是否是MySQL
        else if (storageInfo.type && storageInfo.type.includes('MySQL')) {
            const config = this.storageTypes['MySQL'];
            config.fields.forEach(field => {
                if (storageInfo[field]) {
                    html += `
                        <div class="storage-info-item">
                            <span class="storage-info-label">${config.labels[field]}:</span>
                            <span class="storage-info-value">${storageInfo[field]}</span>
                        </div>
                    `;
                }
            });
        }
        
        return html;
    }

    // 获取存储状态摘要
    getStorageStatusSummary(storageInfo) {
        const summary = {
            isConfigured: storageInfo.status === '已配置',
            type: storageInfo.type || 'Unknown',
            hasRequiredFields: true
        };

        // 检查必需字段
        if (storageInfo.type && storageInfo.type.includes('Cloudflare D1')) {
            summary.hasRequiredFields = !!(storageInfo.account_id && storageInfo.database_id);
        } else if (storageInfo.type && storageInfo.type.includes('MySQL')) {
            summary.hasRequiredFields = !!(storageInfo.host && storageInfo.database);
        }

        return summary;
    }

    // 验证存储配置
    validateStorageConfig(storageInfo) {
        const errors = [];
        
        if (!storageInfo.type) {
            errors.push('缺少存储类型配置');
        }
        
        if (!storageInfo.table_name) {
            errors.push('缺少表名配置');
        }
        
        // 根据存储类型验证特定字段
        if (storageInfo.type && storageInfo.type.includes('Cloudflare D1')) {
            if (!storageInfo.account_id) {
                errors.push('缺少Cloudflare Account ID');
            }
            if (!storageInfo.database_id) {
                errors.push('缺少Cloudflare Database ID');
            }
        } else if (storageInfo.type && storageInfo.type.includes('MySQL')) {
            if (!storageInfo.host) {
                errors.push('缺少MySQL主机地址');
            }
            if (!storageInfo.database) {
                errors.push('缺少MySQL数据库名');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 显示存储配置错误
    displayStorageErrors(errors) {
        const container = document.getElementById('storage-info-details');
        if (!container) return;
        
        let html = `
            <div class="storage-error">
                <h4>❌ 存储配置错误</h4>
                <ul>
        `;
        
        errors.forEach(error => {
            html += `<li>${error}</li>`;
        });
        
        html += `
                </ul>
                <p>请检查服务器配置文件</p>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // 刷新存储信息
    async refreshStorageInfo() {
        try {
            const data = await this.loadStorageDetails();
            const validation = this.validateStorageConfig(data);
            
            if (!validation.isValid) {
                this.displayStorageErrors(validation.errors);
            }
            
            return data;
        } catch (error) {
            console.error('刷新存储信息失败:', error);
            throw error;
        }
    }
}