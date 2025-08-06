// Cookie管理工具
// 处理HttpOnly Cookie的设置和解析

class CookieManager {
    constructor(env) {
        this.env = env;
        this.cookieName = 'cc_auth_token'; // CloudClipboard auth token
        this.csrfCookieName = 'cc_csrf_token';
        this.domain = this.extractDomain(env);
        this.secure = true; // Cloudflare Pages默认HTTPS
        this.sameSite = 'Strict';
    }

    // 提取域名
    extractDomain(env) {
        // 在Cloudflare Pages中，可以从环境变量或请求头获取域名
        // 这里使用默认配置，实际部署时会自动适配
        return null; // 让浏览器自动设置
    }

    // 设置认证Cookie
    setAuthCookie(response, token, maxAge = 7 * 24 * 60 * 60) { // 7天
        const cookieValue = this.createCookieString(this.cookieName, token, {
            httpOnly: true,
            secure: this.secure,
            sameSite: this.sameSite,
            maxAge: maxAge,
            path: '/'
        });

        response.headers.set('Set-Cookie', cookieValue);
        return response;
    }

    // 设置CSRF Cookie
    setCSRFCookie(response, csrfToken, maxAge = 60 * 60) { // 1小时
        const cookieValue = this.createCookieString(this.csrfCookieName, csrfToken, {
            httpOnly: false, // CSRF token需要被JavaScript访问
            secure: this.secure,
            sameSite: this.sameSite,
            maxAge: maxAge,
            path: '/'
        });

        // 如果已经有Set-Cookie头，需要添加多个
        const existingCookies = response.headers.get('Set-Cookie');
        if (existingCookies) {
            response.headers.delete('Set-Cookie');
            response.headers.append('Set-Cookie', existingCookies);
            response.headers.append('Set-Cookie', cookieValue);
        } else {
            response.headers.set('Set-Cookie', cookieValue);
        }

        return response;
    }

    // 清除认证Cookie
    clearAuthCookie(response) {
        const cookieValue = this.createCookieString(this.cookieName, '', {
            httpOnly: true,
            secure: this.secure,
            sameSite: this.sameSite,
            maxAge: 0,
            path: '/'
        });

        response.headers.set('Set-Cookie', cookieValue);
        return response;
    }

    // 清除CSRF Cookie
    clearCSRFCookie(response) {
        const cookieValue = this.createCookieString(this.csrfCookieName, '', {
            httpOnly: false,
            secure: this.secure,
            sameSite: this.sameSite,
            maxAge: 0,
            path: '/'
        });

        const existingCookies = response.headers.get('Set-Cookie');
        if (existingCookies) {
            response.headers.delete('Set-Cookie');
            response.headers.append('Set-Cookie', existingCookies);
            response.headers.append('Set-Cookie', cookieValue);
        } else {
            response.headers.set('Set-Cookie', cookieValue);
        }

        return response;
    }

    // 从请求中获取认证Cookie
    getAuthCookie(request) {
        return this.getCookie(request, this.cookieName);
    }

    // 从请求中获取CSRF Cookie
    getCSRFCookie(request) {
        return this.getCookie(request, this.csrfCookieName);
    }

    // 解析Cookie
    getCookie(request, name) {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) {
            return null;
        }

        const cookies = this.parseCookies(cookieHeader);
        return cookies[name] || null;
    }

    // 解析Cookie字符串
    parseCookies(cookieHeader) {
        const cookies = {};
        
        cookieHeader.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            if (name && rest.length > 0) {
                cookies[name] = decodeURIComponent(rest.join('='));
            }
        });

        return cookies;
    }

    // 创建Cookie字符串
    createCookieString(name, value, options = {}) {
        let cookieString = `${name}=${encodeURIComponent(value)}`;

        if (options.domain) {
            cookieString += `; Domain=${options.domain}`;
        }

        if (options.path) {
            cookieString += `; Path=${options.path}`;
        }

        if (options.maxAge !== undefined) {
            cookieString += `; Max-Age=${options.maxAge}`;
        }

        if (options.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`;
        }

        if (options.httpOnly) {
            cookieString += '; HttpOnly';
        }

        if (options.secure) {
            cookieString += '; Secure';
        }

        if (options.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
        }

        return cookieString;
    }

    // 检查Cookie是否存在且有效
    hasValidAuthCookie(request) {
        const token = this.getAuthCookie(request);
        return token && token.length > 0;
    }

    // 生成Cookie配置摘要（用于调试）
    getCookieConfig() {
        return {
            authCookieName: this.cookieName,
            csrfCookieName: this.csrfCookieName,
            domain: this.domain,
            secure: this.secure,
            sameSite: this.sameSite
        };
    }
}

export { CookieManager };