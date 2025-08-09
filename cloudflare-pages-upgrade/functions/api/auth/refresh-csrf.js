import { verifyAuthToken } from '../auth.js';
import { CSRFProtection } from '../../utils/csrf.js';
import { CookieManager } from '../../utils/cookie.js';

// 刷新CSRF token的API端点
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 验证JWT token（不需要CSRF验证）
        const authResult = await verifyAuthToken(request, env);
        
        if (!authResult.valid || !authResult.authenticated) {
            return new Response(JSON.stringify({
                success: false,
                error: '认证失败，请重新登录'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 生成新的CSRF token
        const csrfProtection = new CSRFProtection(env);
        const newCSRFToken = await csrfProtection.generateCSRFToken(authResult.sessionId);
        
        console.log('为会话生成新的CSRF token:', authResult.sessionId);
        
        // 创建响应
        let response = new Response(JSON.stringify({
            success: true,
            csrfToken: newCSRFToken,
            message: 'CSRF token已刷新'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        // 如果使用Cookie模式，也更新CSRF Cookie
        const cookieManager = new CookieManager(env);
        response = cookieManager.setCSRFCookie(response, newCSRFToken, 60 * 60); // 1小时
        
        return response;
        
    } catch (error) {
        console.error('刷新CSRF token失败:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '刷新失败: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}