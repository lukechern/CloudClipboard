// API处理密码验证
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const formData = await request.formData();
        const password = formData.get('password');
        
        if (!password) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: '请输入密码' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 检查环境变量中的密码
        const correctPassword = env.ACCESS_PASSWORD;
        
        if (!correctPassword) {
            // 如果没有设置密码，则允许访问
            return new Response(JSON.stringify({ 
                success: true, 
                message: '访问已授权（未设置密码保护）' 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (password === correctPassword) {
            return new Response(JSON.stringify({ 
                success: true, 
                message: '密码验证成功' 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ 
                success: false, 
                error: '密码错误' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false,
            error: '验证失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        // 检查是否需要密码保护
        const needsPassword = !!env.ACCESS_PASSWORD;
        
        return new Response(JSON.stringify({ 
            needs_password: needsPassword,
            message: needsPassword ? '需要密码验证' : '无需密码验证'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '检查认证状态失败: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}