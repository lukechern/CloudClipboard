
function debugToolbarLayout() {
    const batchToolbar = document.getElementById('batchToolbar');
    if (!batchToolbar || !batchToolbar.classList.contains('show')) {
        console.error("错误：批量操作工具栏 (batchToolbar) 不可见。请先激活工具栏再运行此脚本。");
        return;
    }

    const actionsContainers = batchToolbar.querySelectorAll('.actions');
    const leftActions = actionsContainers[0];
    const rightActions = actionsContainers[1];
    const deleteButton = rightActions ? rightActions.querySelector('.delete-btn') : null;

    if (!leftActions || !rightActions || !deleteButton) {
        console.error("错误：无法找到一个或多个关键子元素 (.actions, .delete-btn)。");
        return;
    }

    // --- 获取位置和尺寸信息 ---
    const toolbarRect = batchToolbar.getBoundingClientRect();
    const rightActionsRect = rightActions.getBoundingClientRect();
    const deleteButtonRect = deleteButton.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    // --- 获取计算样式 ---
    const toolbarStyles = window.getComputedStyle(batchToolbar);

    console.clear();
    console.log("%c--- 布局诊断信息 ---", "color: blue; font-weight: bold;");

    console.log(`
视口 (Window) 宽度: ${windowWidth}px`);

    console.log("
--- 1. 工具栏 (#batchToolbar) ---");
    console.log(`坐标 (X): ${toolbarRect.x.toFixed(2)}px`);
    console.log(`右边缘 (Right): ${toolbarRect.right.toFixed(2)}px`);
    console.log(`宽度 (Width): ${toolbarRect.width.toFixed(2)}px`);
    console.log(`CSS 'width': ${toolbarStyles.width}`);
    console.log(`CSS 'padding-left': ${toolbarStyles.paddingLeft}`);
    console.log(`CSS 'padding-right': ${toolbarStyles.paddingRight}`);
    
    console.log("
--- 2. 右侧 Actions 容器 ---");
    console.log(`坐标 (X): ${rightActionsRect.x.toFixed(2)}px`);
    console.log(`右边缘 (Right): ${rightActionsRect.right.toFixed(2)}px`);
    console.log(`宽度 (Width): ${rightActionsRect.width.toFixed(2)}px`);

    console.log("
--- 3. 批量删除按钮 (.delete-btn) ---");
    console.log(`坐标 (X): ${deleteButtonRect.x.toFixed(2)}px`);
    console.log(`右边缘 (Right): ${deleteButtonRect.right.toFixed(2)}px`);
    console.log(`宽度 (Width): ${deleteButtonRect.width.toFixed(2)}px`);

    console.log("
%c--- 分析 ---", "color: blue; font-weight: bold;");

    const toolbarRightEdge = toolbarRect.right;
    const rightActionsRightEdge = rightActionsRect.right;
    
    // 计算右侧 Actions 容器的右边缘与其父容器（工具栏）的右侧内边距边缘的差距
    const effectiveToolbarRightEdge = toolbarRect.right - parseFloat(toolbarStyles.paddingRight);
    const overflow = rightActionsRightEdge - effectiveToolbarRightEdge;

    console.log(`工具栏的右侧内边距边缘 (Right - padding-right) 约等于: ${effectiveToolbarRightEdge.toFixed(2)}px`);
    console.log(`右侧 Actions 容器的右边缘在: ${rightActionsRightEdge.toFixed(2)}px`);

    if (Math.abs(overflow) < 1) {
        console.log("✅ [结论1] Actions 容器的右边缘与其父容器的右侧内边距边缘对齐，符合 'space-between' 预期。");
    } else {
        console.error(`❌ [结论1] Actions 容器溢出了其父容器的内边距区域 ${overflow.toFixed(2)}px。`);
    }

    const spaceBetweenToolbarAndWindow = windowWidth - toolbarRect.right;
    console.log(`
[补充信息] 工具栏右侧边缘与屏幕右边缘之间有 ${spaceBetweenToolbarAndWindow.toFixed(2)}px 的间距。`);
    console.log("这个间距是由于工具栏 'width' 和 'margin: auto' 造成的，是预期的空白区域。");
}

// 运行诊断函数
debugToolbarLayout();
