import { verifyAuthToken } from './auth.js';

// 验证访问权限
async function checkAuth(request, env) {
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        return { authorized: true };
    }
    
    // 使用JWT验证
    const authResult = await verifyAuthToken(request, env);
    
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

// API处理数据库初始化
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // 验证访问权限
    const authResult = await checkAuth(request, env);
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
    const authResult = await checkAuth(request, env);
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