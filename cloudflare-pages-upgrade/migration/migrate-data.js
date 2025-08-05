/**
 * 数据迁移脚本
 * 用于从PHP版本的CloudClipboard迁移数据到Cloudflare Pages版本
 */

// 配置信息
const CONFIG = {
    // 原PHP版本的API端点
    SOURCE_API: 'https://your-old-domain.com/index.php?get_records=1',
    
    // 新Cloudflare Pages版本的API端点
    TARGET_API: 'https://your-new-domain.pages.dev/api/records',
    
    // 批量处理大小
    BATCH_SIZE: 10
};

/**
 * 从源系统获取所有记录
 */
async function fetchSourceRecords() {
    try {
        console.log('正在从源系统获取记录...');
        const response = await fetch(CONFIG.SOURCE_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const records = await response.json();
        console.log(`成功获取 ${records.length} 条记录`);
        return records;
    } catch (error) {
        console.error('获取源记录失败:', error);
        throw error;
    }
}

/**
 * 将记录保存到目标系统
 */
async function saveToTarget(record) {
    try {
        const formData = new FormData();
        formData.append('content', record.content);
        
        const response = await fetch(CONFIG.TARGET_API, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`保存记录失败 (ID: ${record.id}):`, error);
        throw error;
    }
}

/**
 * 批量迁移记录
 */
async function migrateRecords(records) {
    console.log(`开始迁移 ${records.length} 条记录...`);
    
    let successCount = 0;
    let failureCount = 0;
    const failures = [];
    
    // 按批次处理
    for (let i = 0; i < records.length; i += CONFIG.BATCH_SIZE) {
        const batch = records.slice(i, i + CONFIG.BATCH_SIZE);
        console.log(`处理批次 ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(records.length / CONFIG.BATCH_SIZE)}`);
        
        // 并行处理批次内的记录
        const promises = batch.map(async (record) => {
            try {
                await saveToTarget(record);
                successCount++;
                console.log(`✓ 成功迁移记录 ID: ${record.id}`);
            } catch (error) {
                failureCount++;
                failures.push({ record, error: error.message });
                console.log(`✗ 迁移失败记录 ID: ${record.id}`);
            }
        });
        
        await Promise.all(promises);
        
        // 批次间延迟，避免过载
        if (i + CONFIG.BATCH_SIZE < records.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return { successCount, failureCount, failures };
}

/**
 * 生成迁移报告
 */
function generateReport(result, totalRecords) {
    const report = `
=== 数据迁移报告 ===
总记录数: ${totalRecords}
成功迁移: ${result.successCount}
失败记录: ${result.failureCount}
成功率: ${((result.successCount / totalRecords) * 100).toFixed(2)}%

${result.failures.length > 0 ? `
失败记录详情:
${result.failures.map(f => `- ID: ${f.record.id}, 错误: ${f.error}`).join('\n')}
` : ''}
===================
    `;
    
    console.log(report);
    return report;
}

/**
 * 主迁移函数
 */
async function migrate() {
    try {
        console.log('开始数据迁移...');
        console.log(`源系统: ${CONFIG.SOURCE_API}`);
        console.log(`目标系统: ${CONFIG.TARGET_API}`);
        console.log('---');
        
        // 获取源数据
        const sourceRecords = await fetchSourceRecords();
        
        if (sourceRecords.length === 0) {
            console.log('没有需要迁移的记录');
            return;
        }
        
        // 确认迁移
        const confirmed = confirm(`确定要迁移 ${sourceRecords.length} 条记录吗？`);
        if (!confirmed) {
            console.log('迁移已取消');
            return;
        }
        
        // 执行迁移
        const result = await migrateRecords(sourceRecords);
        
        // 生成报告
        const report = generateReport(result, sourceRecords.length);
        
        // 保存报告到本地存储（如果在浏览器环境中）
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('migration-report', report);
            console.log('迁移报告已保存到本地存储');
        }
        
        console.log('数据迁移完成！');
        
    } catch (error) {
        console.error('迁移过程中发生错误:', error);
    }
}

// 如果在浏览器环境中，提供全局函数
if (typeof window !== 'undefined') {
    window.migrateData = migrate;
    window.migrationConfig = CONFIG;
}

// 如果在Node.js环境中，直接执行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { migrate, CONFIG };
    
    // 如果直接运行此脚本
    if (require.main === module) {
        migrate();
    }
}