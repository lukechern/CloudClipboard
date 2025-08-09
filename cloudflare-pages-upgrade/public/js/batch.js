// 批量删除记录功能
function batchDeleteRecords(ids) {
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
        
        // 发送批量删除请求到服务器，使用智能fetch处理token过期
        const deletePromises = ids.map(id => {
            const fetchPromise = window.authManager ? 
                window.authManager.smartFetch(`/api/records?id=${id}`, { method: 'DELETE' }) :
                fetch(`/api/records?id=${id}`, { method: 'DELETE' });
            
            return fetchPromise.then(async response => {
                console.log(`删除记录 ${id} 响应状态:`, response.status);
                
                if (!response.ok) {
                    // 获取详细错误信息
                    let errorMessage = `删除记录 ${id} 失败: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMessage = `删除记录 ${id} 失败: ${errorData.error}`;
                        }
                    } catch (e) {
                        // 无法解析错误响应，使用默认消息
                    }
                    
                    // 如果是401错误，可能需要重新认证
                    if (response.status === 401 && window.authManager) {
                        console.log('批量删除认证失败，尝试刷新token...');
                        const refreshed = await window.authManager.refreshCSRFToken();
                        if (refreshed) {
                            console.log('Token刷新成功，重新尝试删除记录', id);
                            // 重新发起删除请求
                            const retryResponse = await window.authManager.smartFetch(`/api/records?id=${id}`, { method: 'DELETE' });
                            if (retryResponse.ok) {
                                return retryResponse;
                            }
                        }
                    }
                    
                    throw new Error(errorMessage);
                }
                return response;
            });
        });
        
        Promise.all(deletePromises)
        .then(responses => {
            // 检查所有请求是否成功
            const allSuccessful = responses.every(response => response.ok);
            if (allSuccessful) {
                console.log(`批量删除成功: ${ids.length} 条记录`);
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
            
            // 提供更详细的错误信息
            let errorMessage = '批量删除失败';
            if (error.message.includes('401')) {
                errorMessage = '认证失败，请重新登录后再试';
            } else if (error.message.includes('网络')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else {
                errorMessage = '批量删除失败: ' + error.message;
            }
            
            showNotification(errorMessage);
            
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
