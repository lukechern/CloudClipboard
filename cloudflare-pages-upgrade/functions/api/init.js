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

// API处理数据库初始化
export async function onRequestPost(context) {
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
        // 创建数据库表
        const result = await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS ${env.TABLE_NAME} (
                id INTEGER PRIMARY KEY,
                content TEXT NOT NULL,
                length INTEGER NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        
        if (result.success) {
            return new Response(JSON.stringify({ 
                success: true, 
                message: '数据库表创建成功' 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('创建表失败');
        }
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '数据库初始化失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        // 检查表是否存在
        const result = await env.DB.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='${env.TABLE_NAME}'
        `).first();
        
        const tableExists = !!result;
        
        return new Response(JSON.stringify({ 
            table_exists: tableExists,
            table_name: env.TABLE_NAME,
            message: tableExists ? '数据库表已存在' : '数据库表不存在，需要初始化'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '检查数据库状态失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}