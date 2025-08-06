// 批量删除记录功能
function batchDeleteRecords(ids) {
    // 调试信息
    console.log('批量删除开始，记录ID:', ids);
    console.log('认证管理器状态:', {
        exists: !!window.authManager,
        isAuthenticated: window.authManager?.isAuthenticated,
        usesCookies: window.authManager?.usesCookies,
        hasCSRFToken: !!window.authManager?.csrfToken,
        authHeaders: window.authManager?.getAuthHeaders()
    });
    
    showConfirm('确认删除', `确定要删除这 ${ids.length} 条记录吗？`, () => {
        // 立即从前端界面移除选中的记录条目
        ids.forEach(id => {
            const recordItem = document.querySelector(`.record-checkbox[data-id="${id}"]`)?.closest('.record-item');
            if (recordItem) {
                recordItem.remove();
            }
        });
        
        // 退出批量操作模式
        exitBatchMode();
        
        // 发送批量删除请求到服务器
        const requestConfig = window.authManager ? 
            window.authManager.getRequestConfig({
                method: 'DELETE'
            }) : {
                method: 'DELETE'
            };
        
        Promise.all(ids.map(id => 
            fetch(`/api/records?id=${id}`, requestConfig)
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error(`删除记录 ${id} 失败:`, response.status, errorData);
                        throw new Error(`删除记录 ${id} 失败: ${response.status} ${errorData.error || ''}`);
                    }
                    return response;
                })
        ))
        .then(responses => {
            // 检查所有请求是否成功
            const allSuccessful = responses.every(response => response.ok);
            if (allSuccessful) {
                // 重新加载记录以确保数据一致性
                if (typeof loadRecords === 'function') {
                    loadRecords();
                }
                showNotification(`已删除 ${ids.length} 条记录`);
            } else {
                throw new Error('部分删除失败');
            }
        })
        .catch(error => {
            console.error('批量删除错误:', error);
            showNotification('批量删除失败: ' + error.message);
            // 如果删除失败，重新加载记录以恢复界面
            if (typeof loadRecords === 'function') {
                loadRecords();
            }
        });
    });
}

// 进入批量操作模式
function enterBatchMode() {
    // 添加批量操作模式类
    document.body.classList.add('batch-mode');
    
    // 显示批量工具栏
    const batchToolbar = document.getElementById('batchToolbar');
    if (batchToolbar) {
        batchToolbar.classList.add('show');
    }
    
    // 更新记录项以显示复选框
    updateRecordItemsForBatchMode(true);
}

// 退出批量操作模式
function exitBatchMode() {
    // 移除批量操作模式类
    document.body.classList.remove('batch-mode');
    
    // 隐藏批量工具栏
    const batchToolbar = document.getElementById('batchToolbar');
    if (batchToolbar) {
        batchToolbar.classList.remove('show');
    }
    
    // 更新记录项以隐藏复选框
    updateRecordItemsForBatchMode(false);
}

// 更新记录项以适应批量操作模式
function updateRecordItemsForBatchMode(isBatchMode) {
    const recordItems = document.querySelectorAll('.record-item');
    recordItems.forEach(item => {
        const checkbox = item.querySelector('.record-checkbox');
        const copyBtn = item.querySelector('.copy-btn');
        
        if (isBatchMode) {
            item.classList.add('batch-mode');
            checkbox.style.display = 'block';
        } else {
            item.classList.remove('batch-mode');
            checkbox.style.display = 'none';
            checkbox.checked = false; // 取消选中
        }
    });
    
    // 更新工具栏计数
    updateBatchToolbarCount();
}

// 更新批量操作工具栏中的选中数量
function updateBatchToolbarCount() {
    const checkboxes = document.querySelectorAll('.record-checkbox:checked');
    const count = checkboxes.length;
    
    const countElement = document.querySelector('.batch-toolbar .count');
    if (countElement) {
        countElement.textContent = `已选择 ${count} 项`;
    }
    
    // 根据选中数量启用/禁用删除按钮
    const deleteBtn = document.querySelector('.batch-toolbar .delete-btn');
    if (deleteBtn) {
        deleteBtn.disabled = count === 0;
    }
}
