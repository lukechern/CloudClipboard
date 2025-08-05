// API处理存储信息查询
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const storageInfo = {
            type: 'Cloudflare D1 数据库',
            location: 'Cloudflare 云端',
            table_name: env.TABLE_NAME || 'cloudclipboard',
            status: '已配置',
            description: 'Cloudflare D1 数据库 (Cloudflare 云端)'
        };
        
        return new Response(JSON.stringify(storageInfo), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '获取存储信息失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}