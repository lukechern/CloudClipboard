// 验证访问权限
function checkAuth(request, env) {
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        return { authorized: true };
    }

    // 检查请求头中的授权信息
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: '需要密码验证' };
    }

    const token = authHeader.substring(7);
    // 简单的token验证（实际应用中应该使用更安全的方式）
    const expectedToken = btoa(env.ACCESS_PASSWORD);

    if (token !== expectedToken) {
        return { authorized: false, error: '访问权限验证失败' };
    }

    return { authorized: true };
}

// API处理存储信息查询
export async function onRequestGet(context) {
    const { request, env } = context;

    // 验证访问权限
    const authResult = checkAuth(request, env);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const storageInfo = {
            type: 'Cloudflare D1 数据库',
            location: 'Cloudflare 云端',
            table_name: env.TABLE_NAME || 'cloudclipboard',
            status: '已配置',
            description: 'Cloudflare (云端 D1 数据库)'
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