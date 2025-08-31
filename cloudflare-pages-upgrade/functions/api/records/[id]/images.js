import { verifyAuthToken, verifyFullAuth } from '../../auth.js';

// 验证访问权限
async function checkAuth(request, env, requireCSRF = false) {
    console.log('检查访问权限，requireCSRF:', requireCSRF);
    
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        console.log('未设置访问密码，允许访问');
        return { authorized: true };
    }
    
    // 使用完整的认证验证
    const authResult = await verifyFullAuth(request, env, requireCSRF);
    console.log('认证验证结果:', {
        valid: authResult.valid,
        authenticated: authResult.authenticated,
        error: authResult.error
    });
    
    if (!authResult.valid) {
        console.log('认证验证失败:', authResult.error);
        return { 
            authorized: false, 
            error: '访问权限验证失败: ' + authResult.error 
        };
    }
    
    if (!authResult.authenticated) {
        console.log('用户未认证');
        return { 
            authorized: false, 
            error: '未经授权的访问' 
        };
    }
    
    console.log('认证检查通过');
    return { authorized: true, payload: authResult.payload };
}

// 获取指定记录的完整图片数据
export async function onRequestGet(context) {
    const { request, env, params } = context;
    
    // 验证访问权限（GET请求不需要CSRF验证）
    const authResult = await checkAuth(request, env, false);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const recordId = params.id;
        
        if (!recordId) {
            return new Response(JSON.stringify({ error: '缺少记录ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 从D1数据库获取指定记录的图片数据
        const result = await env.DB.prepare(
            `SELECT images, thumbnails FROM ${env.TABLE_NAME} WHERE id = ?`
        ).bind(recordId).first();

        if (!result) {
            return new Response(JSON.stringify({ error: '记录不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 返回完整的图片数据
        const response = {
            id: recordId,
            images: result.images,
            thumbnails: result.thumbnails
        };

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('获取图片数据错误:', error);
        return new Response(JSON.stringify({ 
            error: '获取图片数据失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}