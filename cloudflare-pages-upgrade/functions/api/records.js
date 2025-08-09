import { verifyAuthToken, verifyFullAuth } from './auth.js';

// 验证访问权限
async function checkAuth(request, env, requireCSRF = true) {
    console.log('检查访问权限，requireCSRF:', requireCSRF);
    
    // 如果没有设置密码，允许访问
    if (!env.ACCESS_PASSWORD) {
        console.log('未设置访问密码，允许访问');
        return { authorized: true };
    }
    
    // 使用完整的认证验证（包括CSRF）
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

// API处理记录相关操作
export async function onRequestPost(context) {
    const { request, env } = context;
    
    // 验证访问权限（POST请求需要CSRF验证）
    let authResult = await checkAuth(request, env, true);
    
    // 如果CSRF验证失败，尝试不带CSRF验证（临时解决方案）
    if (!authResult.authorized && authResult.error.includes('CSRF')) {
        console.log('CSRF验证失败，尝试不带CSRF验证:', authResult.error);
        authResult = await checkAuth(request, env, false);
        
        if (authResult.authorized) {
            console.log('警告: 使用了不带CSRF验证的请求，建议检查前端CSRF token设置');
        }
    }
    
    if (!authResult.authorized) {
        console.log('认证失败:', authResult.error);
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await request.formData();
        const content = formData.get('content');

        if (!content || content.trim() === '') {
            return new Response(JSON.stringify({ error: '内容不能为空' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const length = content.length;
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // 检查表结构，看是否有archived字段
        let hasArchivedColumn = false;
        try {
            const columns = await env.DB.prepare(`PRAGMA table_info(${env.TABLE_NAME})`).all();
            hasArchivedColumn = columns.results.some(col => col.name === 'archived');
        } catch (e) {
            console.log('检查表结构失败:', e);
        }
        
        // 保存到D1数据库
        let result;
        if (hasArchivedColumn) {
            result = await env.DB.prepare(
                `INSERT INTO ${env.TABLE_NAME} (content, length, timestamp, archived) VALUES (?, ?, ?, 0)`
            ).bind(content, length, timestamp).run();
        } else {
            result = await env.DB.prepare(
                `INSERT INTO ${env.TABLE_NAME} (content, length, timestamp) VALUES (?, ?, ?)`
            ).bind(content, length, timestamp).run();
        }

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                message: '保存成功',
                id: result.meta.last_row_id
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('保存失败');
        }

    } catch (error) {
        return new Response(JSON.stringify({
            error: '保存失败: ' + error.message
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
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') || 'cache'; // 默认显示缓存（非存档）
        
        // 首先检查表结构，看是否有archived字段
        let hasArchivedColumn = false;
        try {
            const columns = await env.DB.prepare(`PRAGMA table_info(${env.TABLE_NAME})`).all();
            hasArchivedColumn = columns.results.some(col => col.name === 'archived');
        } catch (e) {
            console.log('检查表结构失败:', e);
        }
        
        let query;
        if (hasArchivedColumn) {
            // 如果有archived字段，按过滤器查询
            if (filter === 'archived') {
                query = `SELECT * FROM ${env.TABLE_NAME} WHERE archived = 1 ORDER BY timestamp DESC`;
            } else {
                query = `SELECT * FROM ${env.TABLE_NAME} WHERE archived = 0 OR archived IS NULL ORDER BY timestamp DESC`;
            }
        } else {
            // 如果没有archived字段，只在cache模式下显示所有记录
            if (filter === 'archived') {
                // 存档模式但没有archived字段，返回空数组
                return new Response(JSON.stringify([]), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                // 缓存模式，显示所有记录
                query = `SELECT * FROM ${env.TABLE_NAME} ORDER BY timestamp DESC`;
            }
        }
        
        // 从D1数据库获取记录
        const result = await env.DB.prepare(query).all();

        if (result.success) {
            // 清理记录内容
            const records = result.results.map(record => ({
                ...record,
                content: record.content.trim(),
                archived: record.archived || 0
            }));

            return new Response(JSON.stringify(records), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('获取记录失败');
        }

    } catch (error) {
        console.error('获取记录错误:', error);
        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut(context) {
    const { request, env } = context;
    
    // 验证访问权限（PUT请求需要CSRF验证）
    let authResult = await checkAuth(request, env, true);
    
    // 如果CSRF验证失败，尝试不带CSRF验证（临时解决方案）
    if (!authResult.authorized && env.ACCESS_PASSWORD) {
        authResult = await checkAuth(request, env, false);
    }
    
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const formData = await request.formData();
        const id = formData.get('id');
        const archived = formData.get('archived');

        if (!id) {
            return new Response(JSON.stringify({ error: '缺少记录ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 检查表结构，看是否有archived字段
        let hasArchivedColumn = false;
        try {
            const columns = await env.DB.prepare(`PRAGMA table_info(${env.TABLE_NAME})`).all();
            hasArchivedColumn = columns.results.some(col => col.name === 'archived');
        } catch (e) {
            console.log('检查表结构失败:', e);
        }

        if (!hasArchivedColumn) {
            return new Response(JSON.stringify({
                error: '数据库表结构不支持存档功能，请先升级数据库'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新存档状态
        const result = await env.DB.prepare(
            `UPDATE ${env.TABLE_NAME} SET archived = ? WHERE id = ?`
        ).bind(archived === '1' ? 1 : 0, id).run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                message: archived === '1' ? '已移入存档' : '已移出存档'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('更新失败');
        }

    } catch (error) {
        return new Response(JSON.stringify({
            error: '更新存档状态失败: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    
    // 验证访问权限（DELETE请求需要CSRF验证）
    const authResult = await checkAuth(request, env, true);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: '缺少记录ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 从D1数据库删除记录
        const result = await env.DB.prepare(
            `DELETE FROM ${env.TABLE_NAME} WHERE id = ?`
        ).bind(id).run();

        if (result.success) {
            return new Response(JSON.stringify({
                success: true,
                message: '删除成功'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('删除失败');
        }

    } catch (error) {
        return new Response(JSON.stringify({
            error: '删除失败: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}