// 内容管理模块入口文件
// 该文件负责加载所有内容相关的功能模块

// 使用同步方式加载模块，确保顺序正确
function loadContentModuleSync(modulePath) {
    console.log('同步加载模块:', modulePath);
    const script = document.createElement('script');
    script.src = modulePath;
    script.async = false; // 确保按顺序执行
    document.head.appendChild(script);
}

// 立即同步加载所有模块
console.log('开始加载内容模块...');

// 按依赖顺序加载模块
loadContentModuleSync('js/content/pull-to-refresh.js');
loadContentModuleSync('js/content/content-toggle.js');
loadContentModuleSync('js/content/image-viewer.js');
loadContentModuleSync('js/content/records-loader.js');
loadContentModuleSync('js/content/archive-manager.js');
loadContentModuleSync('js/content/tab-manager.js');
loadContentModuleSync('js/content/debug-helper.js');
loadContentModuleSync('js/content/content-main.js');

// 设置全局标志
window.contentModulesReady = true;

console.log('内容模块加载脚本已执行完成');

// 添加一个验证函数，检查所有关键函数是否已注册
function verifyGlobalFunctions() {
    const requiredFunctions = [
        'toggleArchive',
        'toggleContent', 
        'viewImage',
        'closeImageModal',
        'loadRecords',
        'copyToClipboard',
        'downloadRecordImages',
        'triggerRefresh'
    ];
    
    console.log('验证全局函数注册状态:');
    requiredFunctions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        console.log(`${funcName}: ${exists ? '✓' : '✗'}`);
    });
}

// 延迟验证，确保所有模块都已加载
setTimeout(verifyGlobalFunctions, 1000);