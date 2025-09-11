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
            <div class="modal-overlay-7ree" id="tagModalOverlay_7ree">
                <div class="modal-content-7ree">
                    <div class="modal-header-7ree">
                        <h3>设置标签</h3>
                        <button class="modal-close-7ree" onclick="tagDialog_7ree.hide()">&times;</button>
                    </div>
                    <div class="modal-body-7ree">
                        <div class="form-group-7ree">
                            <label for="tagInput_7ree">标签名称：</label>
                            <input type="text" id="tagInput_7ree" class="tag-input-7ree" 
                                   value="${this.escapeHtml(currentTag)}" 
                                   placeholder="请输入标签名称" maxlength="20">
                        </div>
                        <div class="tag-suggestions-7ree">
                            <span class="suggestion-label-7ree">常用标签：</span>
                            <button class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('工作')">工作</button>
                            <button class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('生活')">生活</button>
                            <button class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('学习')">学习</button>
                            <button class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('重要')">重要</button>
                            <button class="tag-suggestion-7ree" onclick="tagDialog_7ree.selectTag('默认tag')">默认tag</button>
                        </div>
                    </div>
                    <div class="modal-footer-7ree">
                        <button class="btn-cancel-7ree" onclick="tagDialog_7ree.hide()">取消</button>
                        <button class="btn-save-7ree" onclick="tagDialog_7ree.save()">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // 聚焦输入框
        setTimeout(() => {
            const input = document.getElementById('tagInput_7ree');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
        
        // 添加键盘事件
        this.addKeyboardEvents();
    }

    // 隐藏对话框
    hide() {
        const modal = document.getElementById('tagModalOverlay_7ree');
        if (modal) {
            modal.remove();
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
        try {
            const response = await fetch('/api/update-tag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: recordId,
                    tag_7ree: tag
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result.success === true;
        } catch (error) {
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
}

// 创建全局实例
const tagDialog_7ree = new TagDialog_7ree();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagDialog_7ree;
}