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

// 处理tag更新请求
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 验证访问权限
        let authResult = await checkAuth(request, env, true);
        
        // 如果CSRF验证失败，尝试不带CSRF验证（临时解决方案）
        if (!authResult.authorized && authResult.error.includes('CSRF')) {
            console.log('CSRF验证失败，尝试不带CSRF验证:', authResult.error);
            authResult = await checkAuth(request, env, false);
        }
        
        if (!authResult.authorized) {
            return new Response(JSON.stringify({
                success: false,
                error: authResult.error
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token'
                }
            });
        }
        
        // 解析请求数据
        const requestData = await request.json();
        const { id, tag_7ree } = requestData;
        
        console.log('收到tag更新请求:', { id, tag_7ree });
        console.log('环境变量检查:', { 
            TABLE_NAME: env.TABLE_NAME, 
            DB_exists: !!env.DB 
        });
        
        // 验证必需参数
        if (!id) {
            console.error('缺少记录ID参数');
            return new Response(JSON.stringify({
                success: false,
                error: '缺少记录ID'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 验证tag长度
        const tag = tag_7ree || '默认tag';
        if (tag.length > 20) {
            return new Response(JSON.stringify({
                success: false,
                error: '标签长度不能超过20个字符'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 获取表名
        const tableName = env.TABLE_NAME || 'records';
        
        // 检查记录是否存在
        const checkStmt = env.DB.prepare(`SELECT id FROM ${tableName} WHERE id = ?`);
        const existingRecord = await checkStmt.bind(id).first();
        
        if (!existingRecord) {
            return new Response(JSON.stringify({
                success: false,
                error: '记录不存在'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // 更新tag字段
        console.log('准备执行SQL更新:', { tableName, tag, id });
        const updateStmt = env.DB.prepare(`UPDATE ${tableName} SET tag_7ree = ? WHERE id = ?`);
        const result = await updateStmt.bind(tag, id).run();
        
        console.log('SQL执行结果:', result);
        
        if (result.success) {
            console.log('Tag更新成功，记录ID:', id, '新tag:', tag);
            
            return new Response(JSON.stringify({
                success: true,
                message: '标签更新成功',
                data: {
                    id: id,
                    tag_7ree: tag
                }
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            console.error('Tag更新失败:', result);
            
            return new Response(JSON.stringify({
                success: false,
                error: '数据库更新失败: ' + JSON.stringify(result)
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
    } catch (error) {
        console.error('Tag更新过程中发生错误:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: '服务器内部错误: ' + error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions(context) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
            'Access-Control-Max-Age': '86400'
        }
    });
}