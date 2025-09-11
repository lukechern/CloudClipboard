// Tag编辑对话框组件
// 版本: 2.0 - 使用 /api/records 端点
console.log('tag-dialog_7ree.js 版本 2.0 已加载 - 使用 /api/records 端点');

class TagDialog_7ree {
    constructor() {
        this.currentRecordId = null;
        this.currentTag = '';
    }

    // 显示tag编辑对话框
    show(recordId, currentTag = '默认tag') {
        // 验证记录是否存在于前端缓存中
        const recordIdInt = Number.parseInt(recordId, 10);
        const cachedRecord = window.recordsData ? window.recordsData.get(recordIdInt) : null;
        
        console.log('显示标签编辑对话框:');
        console.log('  记录ID:', recordId, '类型:', typeof recordId);
        console.log('  整数ID:', recordIdInt);
        console.log('  当前标签:', currentTag);
        console.log('  缓存记录:', cachedRecord);
        console.log('  全局记录数据大小:', window.recordsData ? window.recordsData.size : 0);
        
        if (!cachedRecord) {
            console.warn('警告：记录在前端缓存中不存在，可能需要刷新列表');
            if (typeof showNotification === 'function') {
                showNotification('记录数据不同步，请先刷新列表', 'warning');
            }
            // 仍然允许显示对话框，但给出警告
        }
        
        this.currentRecordId = recordId;
        this.currentTag = currentTag;
        
        const modalHTML = `
            <div class="tag-dialog-overlay" id="tagModalOverlay_7ree">
                <div class="tag-dialog">
                    <div class="tag-dialog-title">设置标签</div>
                    <div id="tagDialogMessage_7ree"></div>
                    <form class="tag-dialog-form">
                        <input type="text" id="tagInput_7ree" class="tag-dialog-input" 
                               value="${this.escapeHtml(currentTag)}" 
                               placeholder="请输入标签名称" maxlength="20">
                        <div class="tag-suggestions-7ree">
                            <span class="suggestion-label-7ree">常用标签：</span>
                            <button type="button" class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('工作')">工作</button>
                            <button type="button" class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('生活')">生活</button>
                            <button type="button" class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('学习')">学习</button>
                            <button type="button" class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('重要')">重要</button>
                            <button type="button" class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('默认tag')">默认tag</button>
                        </div>
                        <div class="tag-dialog-buttons">
                            <button type="button" class="tag-dialog-btn tag-dialog-btn-cancel" onclick="tagDialog_7ree.hide()">取消</button>
                            <button type="button" class="tag-dialog-btn tag-dialog-btn-save" onclick="tagDialog_7ree.save()">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // 添加到页面
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // 显示对话框
        setTimeout(() => {
            const overlay = document.getElementById('tagModalOverlay_7ree');
            if (overlay) {
                overlay.classList.add('show');
            }
            
            // 聚焦输入框
            const input = document.getElementById('tagInput_7ree');
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
        
        // 添加键盘事件
        this.addKeyboardEvents();
    }

    // 隐藏对话框
    hide() {
        const modal = document.getElementById('tagModalOverlay_7ree');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300); // 等待动画完成
        }
    }

    // 选择建议的标签
    selectTag(tagName) {
        const input = document.getElementById('tagInput_7ree');
        if (input) {
            input.value = tagName;
            input.focus();
        }
    }

    // 保存标签
    async save() {
        const input = document.getElementById('tagInput_7ree');
        if (!input) return;
        
        const newTag = input.value.trim() || '默认tag';
        
        if (!this.currentRecordId) {
            this.showMessage('错误：记录ID无效', 'error');
            return;
        }
        
        try {
            // 显示保存中状态
            const saveBtn = document.querySelector('.btn-save-7ree');
            if (saveBtn) {
                saveBtn.textContent = '保存中...';
                saveBtn.disabled = true;
            }
            
            // 调用保存函数
            const success = await this.saveTagToServer(this.currentRecordId, newTag);
            
            if (success) {
                // 更新UI中的标签显示
                this.updateTagInUI(this.currentRecordId, newTag);
                this.showMessage('标签保存成功', 'success');
                this.hide();
            } else {
                this.showMessage('标签保存失败，请重试', 'error');
            }
        } catch (error) {
            console.error('保存标签时出错:', error);
            
            // 如果是记录不存在的错误，尝试刷新记录列表
            if (error.message && error.message.includes('记录不存在')) {
                console.log('记录不存在，尝试刷新记录列表...');
                this.showMessage('记录不存在，正在刷新列表...', 'warning');
                
                // 关闭对话框
                this.hide();
                
                // 刷新记录列表
                if (typeof loadRecords === 'function') {
                    loadRecords(window.currentFilter || 'cache', window.currentTagFilter_7ree || 'all');
                } else {
                    console.error('loadRecords 函数不可用');
                }
                return;
            }
            
            this.showMessage('保存失败：' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            const saveBtn = document.querySelector('.btn-save-7ree');
            if (saveBtn) {
                saveBtn.textContent = '保存';
                saveBtn.disabled = false;
            }
        }
    }

    // 保存标签到服务器
    async saveTagToServer(recordId, tag) {
        // 强制确认使用正确的API端点
        const API_ENDPOINT = '/api/records'; // 明确声明使用的端点
        console.log('✅ 确认使用API端点:', API_ENDPOINT);
        
        const doRequest_7ree = async () => {
            // 调试：检查recordId和全局存储的数据
            console.log('准备保存标签:');
            console.log('  记录ID:', recordId, '类型:', typeof recordId);
            console.log('  标签:', tag);
            
            // 检查记录是否存在于前端缓存中
            const recordIdInt = Number.parseInt(recordId, 10);
            const cachedRecord = window.recordsData ? window.recordsData.get(recordIdInt) : null;
            console.log('  前端缓存中的记录:', cachedRecord);
            
            // 使用 FormData 格式，与存档功能保持一致
            const formData = new FormData();
            formData.append('id', recordIdInt.toString());
            formData.append('tag_7ree', tag);

            let response;
            console.log('即将调用API端点:', API_ENDPOINT, '(PUT方法)');
            if (window.authManager && typeof window.authManager.smartFetch === 'function') {
                console.log('使用 authManager.smartFetch');
                response = await window.authManager.smartFetch(API_ENDPOINT, {
                    method: 'PUT', // 使用PUT方法，与存档功能保持一致
                    body: formData
                });
            } else if (window.authManager && typeof window.authManager.getRequestConfig === 'function') {
                // 退化到getRequestConfig，确保credentials与认证头
                console.log('使用 authManager.getRequestConfig');
                const cfg = window.authManager.getRequestConfig({
                    method: 'PUT',
                    body: formData
                });
                response = await fetch(API_ENDPOINT, cfg);
            } else {
                // 最后兜底，直接fetch并携带Cookie
                console.log('使用直接 fetch');
                response = await fetch(API_ENDPOINT, { 
                    method: 'PUT',
                    body: formData,
                    credentials: 'same-origin' 
                });
            }

            let rawText = '';
            try { rawText = await response.text(); } catch (_) {}

            let json = null;
            try { json = rawText ? JSON.parse(rawText) : null; } catch (_) {}

            if (!response.ok) {
                const msg = (json && (json.error || json.message)) || rawText || `HTTP ${response.status}`;
                throw new Error(msg);
            }

            if (!json) json = { success: false };
            return json.success === true;
        };

        try {
            return await doRequest_7ree();
        } catch (error) {
            // 如果是CSRF相关错误，尝试刷新后重试一次
            const msg = String(error && error.message || '');
            const needRetryCSRF_7ree = /CSRF/i.test(msg) && !!(window.authManager && window.authManager.refreshCSRFToken);
            if (needRetryCSRF_7ree) {
                try {
                    await window.authManager.refreshCSRFToken();
                    return await doRequest_7ree();
                } catch (e2) {
                    console.error('刷新CSRF后仍失败:', e2);
                    throw e2;
                }
            }
            console.error('保存标签到服务器失败:', error);
            throw error;
        }
    }

    // 更新UI中的标签显示
    updateTagInUI(recordId, newTag) {
        const tagBtn = document.querySelector(`[data-record-id="${recordId}"].tag-btn-7ree`);
        if (tagBtn) {
            const tagText = tagBtn.querySelector('.tag-text-7ree');
            if (tagText) {
                tagText.textContent = newTag;
            }
        }
        
        // 如果当前正在按标签筛选，可能需要刷新列表
        if (window.currentTagFilter_7ree && window.currentTagFilter_7ree !== 'all' && window.currentTagFilter_7ree !== newTag) {
            // 如果当前筛选的标签与新标签不同，从列表中移除该项
            const recordItem = document.querySelector(`[data-id="${recordId}"]`)?.closest('.record-item');
            if (recordItem) {
                recordItem.style.opacity = '0.5';
                setTimeout(() => {
                    if (recordItem.parentNode) {
                        recordItem.remove();
                    }
                }, 300);
            }
        }
    }

    // 添加键盘事件
    addKeyboardEvents() {
        const modal = document.getElementById('tagModalOverlay_7ree');
        if (!modal) return;
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.save();
            }
        });
        
        // 点击遮罩层关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide();
            }
        });
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 复用现有的通知系统
        if (typeof showNotification === 'function') {
            showNotification(message);
        } else {
            // 如果是记录不存在的错误，显示更友好的提示
            if (message.includes('记录不存在')) {
                const confirmRefresh = confirm('记录不存在，可能已被删除或数据不同步。\n\n是否立即刷新页面以获取最新数据？');
                if (confirmRefresh) {
                    location.reload();
                }
            } else {
                alert(message);
            }
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 读取Cookie
    getCookie_7ree(name) {
        const cookieStr = document.cookie || '';
        const parts = cookieStr.split(';').map(s => s.trim());
        for (const part of parts) {
            if (!part) continue;
            const eq = part.indexOf('=');
            if (eq === -1) continue;
            const k = decodeURIComponent(part.slice(0, eq));
            if (k === name) {
                return decodeURIComponent(part.slice(eq + 1));
            }
        }
        return null;
    }
}

// 创建全局实例
const tagDialog_7ree = new TagDialog_7ree();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagDialog_7ree;
}