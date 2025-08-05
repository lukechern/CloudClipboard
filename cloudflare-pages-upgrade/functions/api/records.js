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

// API处理记录相关操作
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

        // 保存到D1数据库
        const result = await env.DB.prepare(
            `INSERT INTO ${env.TABLE_NAME} (content, length, timestamp) VALUES (?, ?, ?)`
        ).bind(content, length, timestamp).run();

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
    
    // 验证访问权限
    const authResult = checkAuth(request, env);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 从D1数据库获取记录
        const result = await env.DB.prepare(
            `SELECT * FROM ${env.TABLE_NAME} ORDER BY timestamp DESC`
        ).all();

        if (result.success) {
            // 清理记录内容
            const records = result.results.map(record => ({
                ...record,
                content: record.content.trim()
            }));

            return new Response(JSON.stringify(records), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            throw new Error('获取记录失败');
        }

    } catch (error) {
        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
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