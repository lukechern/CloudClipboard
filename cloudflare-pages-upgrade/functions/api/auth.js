import { JWTUtils } from '../utils/jwt.js';
import { RateLimiter } from '../utils/rateLimit.js';

// API处理密码验证
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // 获取客户端标识符用于速率限制
        const clientId = RateLimiter.getClientIdentifier(request);
        const rateLimiter = new RateLimiter(env);
        
        // 检查速率限制
        const rateCheck = await rateLimiter.checkRateLimit(clientId, {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000, // 15分钟
            blockDurationMs: 60 * 60 * 1000 // 1小时
        });
        
        if (!rateCheck.allowed) {
            return new Response(JSON.stringify({
                success: false,
                error: rateCheck.message,
                blocked: true,
                remainingTime: rateCheck.remainingBlockTime
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const formData = await request.formData();
        const password = formData.get('password');
        
        if (!password) {
            await rateLimiter.recordAttempt(clientId, false);
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
            // 如果没有设置密码，生成一个临时token
            const jwtSecret = env.JWT_SECRET || 'default-secret-key';
            const jwtUtils = new JWTUtils(jwtSecret);
            
            const token = await jwtUtils.generateToken({
                authenticated: true,
                type: 'no-password'
            }, '7d');
            
            await rateLimiter.recordAttempt(clientId, true);
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: '访问已授权（未设置密码保护）',
                token: token
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (password === correctPassword) {
            // 生成JWT token
            const jwtSecret = env.JWT_SECRET || 'default-secret-key';
            const jwtUtils = new JWTUtils(jwtSecret);
            
            const token = await jwtUtils.generateToken({
                authenticated: true,
                type: 'password',
                clientId: clientId
            }, '7d');
            
            await rateLimiter.recordAttempt(clientId, true);
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: '密码验证成功',
                token: token
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await rateLimiter.recordAttempt(clientId, false);
            
            return new Response(JSON.stringify({ 
                success: false, 
                error: '密码错误',
                remaining: rateCheck.remaining - 1
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Auth error:', error);
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
            message: needsPassword ? '需要密码验证' : '无需密码验证',
            jwt_enabled: true // 标识支持JWT
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

// 验证JWT token的辅助函数
export async function verifyAuthToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    try {
        const jwtSecret = env.JWT_SECRET || 'default-secret-key';
        const jwtUtils = new JWTUtils(jwtSecret);
        
        const payload = await jwtUtils.verifyToken(token);
        
        return { 
            valid: true, 
            payload: payload,
            authenticated: payload.authenticated 
        };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
}