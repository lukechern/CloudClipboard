import { verifyAuthToken, verifyFullAuth } from './auth.js';

// 验证访问权限
async function checkAuth(request, env, requireCSRF = false) {
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        return { authorized: true };
    }
    
    // 使用完整的认证验证
    const authResult = await verifyFullAuth(request, env, requireCSRF);
    
    if (!authResult.valid) {
        return { 
            authorized: false, 
            error: '访问权限验证失败: ' + authResult.error 
        };
    }
    
    if (!authResult.authenticated) {
        return { 
            authorized: false, 
            error: '未经授权的访问' 
        };
    }
    
    return { authorized: true, payload: authResult.payload };
}

// API处理存储信息查询
export async function onRequestGet(context) {
    const { request, env } = context;

    // 验证访问权限（GET请求不需要CSRF验证）
    const authResult = await checkAuth(request, env, false);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const storageInfo = {
            type: 'Cloudflare',
            location: 'D1数据库',
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