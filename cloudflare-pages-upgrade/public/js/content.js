// 内容管理模块入口文件
// 该文件负责加载所有内容相关的功能模块

// 动态加载模块的函数
function loadContentModule(modulePath) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = modulePath;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 按顺序加载所有内容模块
async function loadContentModules() {
    try {
        // 按依赖顺序加载模块
        await loadContentModule('js/content/pull-to-refresh.js');
        await loadContentModule('js/content/content-toggle.js');
        await loadContentModule('js/content/image-viewer.js');
        await loadContentModule('js/content/records-loader.js');
        await loadContentModule('js/content/archive-manager.js');
        await loadContentModule('js/content/tab-manager.js');
        await loadContentModule('js/content/debug-helper.js');
        await loadContentModule('js/content/content-main.js');
        
        console.log('所有内容模块加载完成');
    } catch (error) {
        console.error('加载内容模块失败:', error);
    }
}

// 立即开始加载模块
loadContentModules();