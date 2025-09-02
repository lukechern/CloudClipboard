// 数据库状态检查和表结构验证功能
class DatabaseChecker {
    constructor() {
        this.requiredFields = {
            'id': { type: 'INTEGER', description: '记录唯一标识', required: true },
            'content': { type: 'TEXT', description: '文本内容', required: true },
            'length': { type: 'INTEGER', description: '内容长度', required: true },
            'timestamp': { type: 'TEXT', description: '创建时间', required: true },
            'archived': { type: 'INTEGER', description: '存档状态', required: false },
            'images': { type: 'TEXT', description: '图片数据', required: false },
            'thumbnails': { type: 'TEXT', description: '图片缩略图数据', required: false }
        };
    }

    // 检查表是否存在和结构完整性
    async checkTableExists() {
        const requestConfig = window.authManager ? 
            window.authManager.getRequestConfig() : {};
        
        try {
            const response = await fetch('/api/init', requestConfig);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.updateDatabaseStatus(data);
            return data;
            
        } catch (error) {
            console.error('检查表状态失败:', error);
            this.showDatabaseError(error.message);
            throw error;
        }
    }

    // 更新数据库状态显示
    updateDatabaseStatus(data) {
        const statusContainer = document.getElementById('db-status');
        const initForm = document.getElementById('init-form');
        const upgradeForm = document.getElementById('upgrade-form');
        const fixSuggestions = document.getElementById('fix-suggestions');
        
        if (data.table_exists) {
            if (data.needs_upgrade) {
                // 表存在但结构不完整
                statusContainer.innerHTML = `
                    <div class="status-info warning">
                        <h4>⚠️ 数据库结构需要升级</h4>
                        <p>表已存在，但缺少以下字段：<strong>${data.missing_columns.join(', ')}</strong></p>
                        <p>缺失字段可能影响以下功能：</p>
                        <ul>
                            ${data.missing_columns.includes('images') ? '<li>🖼️ 图片存储和下载功能</li>' : ''}
                            ${data.missing_columns.includes('archived') ? '<li>📁 记录存档功能</li>' : ''}
                        </ul>
                    </div>
                `;
                initForm.style.display = 'none';
                upgradeForm.style.display = 'block';
                
                // 显示修复建议
                this.showFixSuggestions(data.missing_columns);
            } else {
                // 表存在且结构完整
                statusContainer.innerHTML = `
                    <div class="status-info success">
                        <h4>✅ 数据库状态正常</h4>
                        <p>数据表已存在且结构完整，支持所有功能</p>
                        <div class="feature-status">
                            <span class="feature-item">📝 文本存储</span>
                            <span class="feature-item">🖼️ 图片存储</span>
                            <span class="feature-item">🔍 图片缩略图</span>
                            <span class="feature-item">📁 记录存档</span>
                            <span class="feature-item">⬇️ 图片下载</span>
                        </div>
                    </div>
                `;
                initForm.style.display = 'none';
                upgradeForm.style.display = 'none';
                fixSuggestions.style.display = 'none';
            }
        } else {
            // 表不存在
            statusContainer.innerHTML = `
                <div class="status-info info">
                    <h4>ℹ️ 数据库未初始化</h4>
                    <p>数据表不存在，需要创建完整的表结构</p>
                    <p>创建后将支持：文本存储、图片存储、图片缩略图、记录存档、图片下载等功能</p>
                </div>
            `;
            initForm.style.display = 'block';
            upgradeForm.style.display = 'none';
            fixSuggestions.style.display = 'none';
        }
    }

    // 显示数据库错误
    showDatabaseError(errorMessage) {
        const statusContainer = document.getElementById('db-status');
        statusContainer.innerHTML = `
            <div class="status-info error">
                <h4>❌ 检查数据库状态失败</h4>
                <p>${errorMessage}</p>
                <p>请检查网络连接和服务器配置</p>
            </div>
        `;
    }

    // 显示修复建议
    showFixSuggestions(missingColumns) {
        const fixSuggestions = document.getElementById('fix-suggestions');
        const fixContent = document.getElementById('fix-suggestions-content');
        
        let suggestions = '<div class="suggestions-list">';
        
        if (missingColumns.includes('images')) {
            suggestions += `
                <div class="suggestion-item">
                    <div class="suggestion-icon">🖼️</div>
                    <div class="suggestion-content">
                        <h4>图片功能支持</h4>
                        <p>缺少 <code>images</code> 字段，无法存储图片数据</p>
                        <p><strong>影响：</strong>无法保存图片、无法显示下载按钮</p>
                    </div>
                </div>
            `;
        }
        
        if (missingColumns.includes('thumbnails')) {
            suggestions += `
                <div class="suggestion-item">
                    <div class="suggestion-icon">🔍</div>
                    <div class="suggestion-content">
                        <h4>缩略图功能支持</h4>
                        <p>缺少 <code>thumbnails</code> 字段，无法存储图片缩略图数据</p>
                        <p><strong>影响：</strong>无法预览图片缩略图、图片加载性能较差</p>
                    </div>
                </div>
            `;
        }
        
        if (missingColumns.includes('archived')) {
            suggestions += `
                <div class="suggestion-item">
                    <div class="suggestion-icon">📁</div>
                    <div class="suggestion-content">
                        <h4>存档功能支持</h4>
                        <p>缺少 <code>archived</code> 字段，无法使用存档功能</p>
                        <p><strong>影响：</strong>无法标记重要记录、无法分类管理记录</p>
                    </div>
                </div>
            `;
        }
        
        suggestions += `
            <div class="suggestion-item action">
                <div class="suggestion-icon">🔧</div>
                <div class="suggestion-content">
                    <h4>推荐操作</h4>
                    <p>点击"升级数据库结构"按钮自动添加缺失字段</p>
                    <p><strong>安全保证：</strong>升级过程不会删除或修改现有数据</p>
                </div>
            </div>
        </div>`;
        
        fixContent.innerHTML = suggestions;
        fixSuggestions.style.display = 'block';
    }

    // 详细检查表结构
    async checkTableStructure(button) {
        const originalText = button.textContent;
        button.textContent = '🔍 检查中...';
        button.disabled = true;
        
        const container = document.getElementById('table-structure-info');
        container.innerHTML = '<div class="loading">正在检查表结构...</div>';
        
        try {
            const requestConfig = window.authManager ? 
                window.authManager.getRequestConfig() : {};
            
            const response = await fetch('/api/init', requestConfig);
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error || '检查失败');
            }
            
            // 显示详细的表结构信息
            this.displayTableStructureInfo(data);
            
        } catch (error) {
            container.innerHTML = `
                <div class="structure-error">
                    <h4>❌ 检查失败</h4>
                    <p>${error.message}</p>
                </div>
            `;
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // 显示表结构详细信息
    displayTableStructureInfo(data) {
        const container = document.getElementById('table-structure-info');
        
        if (!data.table_exists) {
            container.innerHTML = `
                <div class="structure-info">
                    <h4>📋 表结构状态</h4>
                    <div class="structure-status not-exists">
                        <span class="status-icon">❌</span>
                        <span>数据表不存在</span>
                    </div>
                    <p>需要创建新的数据表</p>
                </div>
            `;
            return;
        }
        
        const existingFields = Object.keys(this.requiredFields).filter(field => 
            !data.missing_columns.includes(field)
        );
        
        let html = `
            <div class="structure-info">
                <h4>📋 表结构详情</h4>
                <div class="structure-status exists">
                    <span class="status-icon">✅</span>
                    <span>数据表已存在</span>
                </div>
                
                <div class="fields-analysis">
                    <h5>字段分析</h5>
                    <div class="fields-grid">
        `;
        
        // 显示所有字段状态
        Object.entries(this.requiredFields).forEach(([fieldName, fieldInfo]) => {
            const exists = existingFields.includes(fieldName);
            const statusClass = exists ? 'field-exists' : 'field-missing';
            const statusIcon = exists ? '✅' : '❌';
            const statusText = exists ? '已存在' : '缺失';
            
            html += `
                <div class="field-item ${statusClass}">
                    <div class="field-header">
                        <span class="field-status">${statusIcon}</span>
                        <span class="field-name">${fieldName}</span>
                        <span class="field-type">${fieldInfo.type}</span>
                    </div>
                    <div class="field-description">${fieldInfo.description}</div>
                    <div class="field-status-text">${statusText}</div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                
                <div class="compatibility-check">
                    <h5>功能兼容性</h5>
                    <div class="compatibility-grid">
                        <div class="compatibility-item ${existingFields.includes('content') ? 'compatible' : 'incompatible'}">
                            <span class="compat-icon">${existingFields.includes('content') ? '✅' : '❌'}</span>
                            <span>文本存储</span>
                        </div>
                        <div class="compatibility-item ${existingFields.includes('images') ? 'compatible' : 'incompatible'}">
                            <span class="compat-icon">${existingFields.includes('images') ? '✅' : '❌'}</span>
                            <span>图片存储</span>
                        </div>
                        <div class="compatibility-item ${existingFields.includes('images') ? 'compatible' : 'incompatible'}">
                            <span class="compat-icon">${existingFields.includes('images') ? '✅' : '❌'}</span>
                            <span>图片下载</span>
                        </div>
                        <div class="compatibility-item ${existingFields.includes('thumbnails') ? 'compatible' : 'incompatible'}">
                            <span class="compat-icon">${existingFields.includes('thumbnails') ? '✅' : '❌'}</span>
                            <span>图片缩略图</span>
                        </div>
                        <div class="compatibility-item ${existingFields.includes('archived') ? 'compatible' : 'incompatible'}">
                            <span class="compat-icon">${existingFields.includes('archived') ? '✅' : '❌'}</span>
                            <span>记录存档</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}