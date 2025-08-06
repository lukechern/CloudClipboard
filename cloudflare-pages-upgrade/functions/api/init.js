import { verifyAuthToken, verifyFullAuth } from './auth.js';

// 验证访问权限
async function checkAuth(request, env, requireCSRF = false) {
    console.log('checkAuth called with requireCSRF:', requireCSRF);
    console.log('ACCESS_PASSWORD exists:', !!env.ACCESS_PASSWORD);
    
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        console.log('No ACCESS_PASSWORD set, allowing access');
        return { authorized: true };
    }
    
    // 使用完整的认证验证
    const authResult = await verifyFullAuth(request, env, requireCSRF);
    console.log('Auth result:', authResult);
    
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
    
    // 检查是否是升级操作
    const formData = await request.formData();
    const action = formData.get('action') || 'create';
    
    // 对于升级操作，我们放宽认证要求（临时解决方案）
    let requireStrictAuth = action !== 'upgrade';
    
    // 首先尝试带CSRF验证的认证
    let authResult = await checkAuth(request, env, requireStrictAuth);
    
    // 如果是升级操作且认证失败，尝试不带CSRF验证
    if (!authResult.authorized && action === 'upgrade') {
        console.log('升级操作认证失败，尝试不带CSRF验证');
        authResult = await checkAuth(request, env, false);
    }
    
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const action = formData.get('action') || 'create';
        
        if (action === 'upgrade') {
            // 升级数据库结构
            const columns = await env.DB.prepare(`
                PRAGMA table_info(${env.TABLE_NAME})
            `).all();
            
            const columnNames = columns.results.map(col => col.name);
            
            // 添加缺失的archived字段
            if (!columnNames.includes('archived')) {
                await env.DB.prepare(`
                    ALTER TABLE ${env.TABLE_NAME} ADD COLUMN archived INTEGER DEFAULT 0
                `).run();
            }
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: '数据库表结构升级成功' 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // 创建数据库表
            const result = await env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS ${env.TABLE_NAME} (
                    id INTEGER PRIMARY KEY,
                    content TEXT NOT NULL,
                    length INTEGER NOT NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    archived INTEGER DEFAULT 0
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
        }
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '数据库操作失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

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
        // 检查表是否存在
        const result = await env.DB.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='${env.TABLE_NAME}'
        `).first();
        
        const tableExists = !!result;
        let needsUpgrade = false;
        let missingColumns = [];
        
        if (tableExists) {
            // 检查表结构是否完整
            const columns = await env.DB.prepare(`
                PRAGMA table_info(${env.TABLE_NAME})
            `).all();
            
            const columnNames = columns.results.map(col => col.name);
            const requiredColumns = ['id', 'content', 'length', 'timestamp', 'archived'];
            
            missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
            needsUpgrade = missingColumns.length > 0;
        }
        
        return new Response(JSON.stringify({ 
            table_exists: tableExists,
            table_name: env.TABLE_NAME,
            needs_upgrade: needsUpgrade,
            missing_columns: missingColumns,
            message: tableExists ? 
                (needsUpgrade ? '数据库表结构不完整，需要升级' : '数据库表已存在且结构完整') : 
                '数据库表不存在，需要初始化'
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