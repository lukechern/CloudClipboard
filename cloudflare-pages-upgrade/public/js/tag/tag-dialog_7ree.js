// Tag编辑对话框组件
class TagDialog_7ree {
    constructor() {
        this.currentRecordId = null;
        this.currentTag = '';
    }

    // 显示tag编辑对话框
    show(recordId, currentTag = '默认tag') {
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
        const getCSRF_7ree = () => (window.authManager && window.authManager.csrfToken) || (this.getCookie_7ree ? this.getCookie_7ree('cc_csrf_token') : null);

        const doRequest_7ree = async () => {
            const csrfToken_7ree = getCSRF_7ree();

            // 统一通过authManager封装请求（自动带Authorization/CSRF/credentials）
            const baseHeaders_7ree = {
                'Content-Type': 'application/json'
            };
            // 仅当全局authManager缺失CSRF时，用Cookie兜底加头，避免覆盖authManager已设置的头
            const extraHeaders_7ree = (!window.authManager || !window.authManager.csrfToken) && csrfToken_7ree
                ? { 'X-CSRF-Token': csrfToken_7ree }
                : {};

            const options_7ree = {
                method: 'POST',
                headers: {
                    ...baseHeaders_7ree,
                    ...extraHeaders_7ree
                },
                body: JSON.stringify({
                    id: recordId,
                    tag_7ree: tag
                })
            };

            let response;
            if (window.authManager && typeof window.authManager.smartFetch === 'function') {
                response = await window.authManager.smartFetch('/api/update-tag', options_7ree);
            } else if (window.authManager && typeof window.authManager.getRequestConfig === 'function') {
                // 退化到getRequestConfig，确保credentials与认证头
                const cfg = window.authManager.getRequestConfig(options_7ree);
                response = await fetch('/api/update-tag', cfg);
            } else {
                // 最后兜底，直接fetch并携带Cookie
                response = await fetch('/api/update-tag', { ...options_7ree, credentials: 'same-origin' });
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
            alert(message);
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