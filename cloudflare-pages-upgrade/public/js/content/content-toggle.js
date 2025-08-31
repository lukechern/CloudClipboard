// 内容展开/收起功能模块

// 切换内容展开/收起状态
function toggleContent(id) {
    console.log('toggleContent 被调用，ID:', id);
    const contentElement = document.querySelector(`.record-content[data-id="${id}"]`);
    if (!contentElement) return;

    const wrapper = contentElement.parentElement;
    const expandBtn = wrapper.querySelector('.expand-btn');
    const isCollapsed = contentElement.classList.contains('collapsed');

    if (isCollapsed) {
        // 展开内容
        contentElement.classList.remove('collapsed');
        if (expandBtn) {
            expandBtn.textContent = '收起';
        }
    } else {
        // 收起内容
        contentElement.classList.add('collapsed');
        if (expandBtn) {
            expandBtn.textContent = '展开';
        }
    }
}

// 确保函数在全局作用域中可用
window.toggleContent = toggleContent;

console.log('内容切换模块已加载，toggleContent函数已注册到全局作用域');