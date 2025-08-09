import { JWTUtils } from '../utils/jwt.js';
import { RateLimiter } from '../utils/rateLimit.js';
import { CSRFProtection } from '../utils/csrf.js';
import { CookieManager } from '../utils/cookie.js';

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

            // 生成会话ID
            const csrfProtection = new CSRFProtection(env);
            const sessionId = await csrfProtection.generateSessionId();

            const token = await jwtUtils.generateToken({
                authenticated: true,
                type: 'no-password',
                sessionId: sessionId
            }, '7d');

            // 生成CSRF token
            const csrfToken = await csrfProtection.generateCSRFToken(sessionId);

            await rateLimiter.recordAttempt(clientId, true);

            // 创建响应
            let response = new Response(JSON.stringify({
                success: true,
                message: '访问已授权（未设置密码保护）',
                token: token,
                csrfToken: csrfToken,
                usesCookies: true
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            // 设置HttpOnly Cookie
            const cookieManager = new CookieManager(env);
            response = cookieManager.setAuthCookie(response, token);
            response = cookieManager.setCSRFCookie(response, csrfToken);

            return response;
        }

        if (password === correctPassword) {
            // 生成JWT token
            const jwtSecret = env.JWT_SECRET || 'default-secret-key';
            const jwtUtils = new JWTUtils(jwtSecret);

            // 生成会话ID
            const csrfProtection = new CSRFProtection(env);
            const sessionId = await csrfProtection.generateSessionId();

            const token = await jwtUtils.generateToken({
                authenticated: true,
                type: 'password',
                clientId: clientId,
                sessionId: sessionId
            }, '7d');

            // 生成CSRF token
            const csrfToken = await csrfProtection.generateCSRFToken(sessionId);

            await rateLimiter.recordAttempt(clientId, true);

            // 创建响应
            let response = new Response(JSON.stringify({
                success: true,
                message: '密码验证成功',
                token: token, // 仍然返回token以保持兼容性
                csrfToken: csrfToken,
                usesCookies: true // 标识使用Cookie模式
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

            // 设置HttpOnly Cookie
            const cookieManager = new CookieManager(env);
            response = cookieManager.setAuthCookie(response, token);
            response = cookieManager.setCSRFCookie(response, csrfToken);

            return response;
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
            jwt_enabled: true, // 标识支持JWT
            csrf_enabled: true, // 标识支持CSRF保护
            cookie_enabled: true // 标识支持HttpOnly Cookie
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

// 注销API
export async function onRequestDelete(context) {
    const { request, env } = context;

    try {
        // 创建响应
        let response = new Response(JSON.stringify({
            success: true,
            message: '已成功注销'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

        // 清除Cookie
        const cookieManager = new CookieManager(env);
        response = cookieManager.clearAuthCookie(response);
        response = cookieManager.clearCSRFCookie(response);

        return response;

    } catch (error) {
        return new Response(JSON.stringify({
            error: '注销失败: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 验证JWT token的辅助函数（支持Cookie和Header两种方式）
export async function verifyAuthToken(request, env) {
    const cookieManager = new CookieManager(env);
    let token = null;

    // 优先从Cookie获取token
    token = cookieManager.getAuthCookie(request);

    // 如果Cookie中没有，尝试从Authorization头获取
    if (!token) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // 移除 "Bearer " 前缀
        }
    }

    if (!token) {
        return { valid: false, error: 'Missing authentication token' };
    }

    try {
        const jwtSecret = env.JWT_SECRET || 'default-secret-key';
        const jwtUtils = new JWTUtils(jwtSecret);

        const payload = await jwtUtils.verifyToken(token);

        return {
            valid: true,
            payload: payload,
            authenticated: payload.authenticated,
            sessionId: payload.sessionId
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

// 验证CSRF token的辅助函数
export async function verifyCSRFToken(request, env, sessionId) {
    const csrfProtection = new CSRFProtection(env);

    // 从请求头获取CSRF token
    let csrfToken = request.headers.get('X-CSRF-Token');
    console.log('从请求头获取CSRF token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');

    // 如果请求头中没有，尝试从表单数据获取
    if (!csrfToken && request.method === 'POST') {
        try {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('multipart/form-data') ||
                contentType.includes('application/x-www-form-urlencoded')) {
                const formData = await request.formData();
                csrfToken = formData.get('csrf_token');
                console.log('从表单数据获取CSRF token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');
            }
        } catch (error) {
            console.log('解析表单数据失败:', error.message);
        }
    }

    // 如果仍然没有找到，尝试从URL参数获取（用于DELETE等请求）
    if (!csrfToken) {
        try {
            const url = new URL(request.url);
            csrfToken = url.searchParams.get('csrf_token');
            console.log('从URL参数获取CSRF token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');
        } catch (error) {
            console.log('解析URL参数失败:', error.message);
        }
    }

    if (!csrfToken) {
        console.log('CSRF验证失败: 未找到CSRF token');
        return { valid: false, error: 'Missing CSRF token' };
    }

    console.log('验证CSRF token，会话ID:', sessionId);
    const result = await csrfProtection.verifyCSRFToken(csrfToken, sessionId);
    console.log('CSRF验证结果:', result.valid ? '成功' : '失败 - ' + result.error);
    
    return result;
}

// 完整的认证和CSRF验证
export async function verifyFullAuth(request, env, requireCSRF = true) {
    // 验证JWT token
    const authResult = await verifyAuthToken(request, env);
    if (!authResult.valid) {
        return authResult;
    }

    // 如果需要CSRF验证
    if (requireCSRF && request.method !== 'GET') {
        const csrfResult = await verifyCSRFToken(request, env, authResult.sessionId);
        if (!csrfResult.valid) {
            return {
                valid: false,
                error: 'CSRF validation failed: ' + csrfResult.error
            };
        }
    }

    return authResult;
}