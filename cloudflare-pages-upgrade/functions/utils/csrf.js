// CSRF保护工具
// 生成和验证CSRF token

class CSRFProtection {
    constructor(env) {
        this.env = env;
        this.secret = env.CSRF_SECRET || env.JWT_SECRET || 'default-csrf-secret';
    }

    // 生成CSRF token
    async generateCSRFToken(sessionId = null) {
        const timestamp = Date.now();
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        
        const payload = {
            timestamp,
            sessionId: sessionId || 'anonymous',
            random: randomString
        };

        const payloadString = JSON.stringify(payload);
        const signature = await this.signData(payloadString);
        
        return this.base64UrlEncode(payloadString) + '.' + signature;
    }

    // 验证CSRF token
    async verifyCSRFToken(token, sessionId = null, maxAge = 3600000) { // 1小时有效期
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Invalid token format');
            }

            const parts = token.split('.');
            if (parts.length !== 2) {
                throw new Error('Invalid token structure');
            }

            const [encodedPayload, signature] = parts;
            const payloadString = this.base64UrlDecode(encodedPayload);
            
            // 验证签名
            const expectedSignature = await this.signData(payloadString);
            if (signature !== expectedSignature) {
                throw new Error('Invalid signature');
            }

            // 解析payload
            const payload = JSON.parse(payloadString);
            
            // 检查时间戳
            const now = Date.now();
            if (now - payload.timestamp > maxAge) {
                throw new Error('Token expired');
            }

            // 检查会话ID（如果提供）
            if (sessionId && payload.sessionId !== sessionId) {
                throw new Error('Session mismatch');
            }

            return {
                valid: true,
                payload: payload
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // 签名数据
    async signData(data) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.secret);
        const messageData = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        return this.base64UrlEncode(new Uint8Array(signature));
    }

    // Base64 URL编码
    base64UrlEncode(data) {
        if (typeof data === 'string') {
            data = new TextEncoder().encode(data);
        }
        
        const base64 = btoa(String.fromCharCode(...data));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    // Base64 URL解码
    base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return atob(str);
    }

    // 从请求中提取CSRF token
    extractCSRFToken(request) {
        // 优先从请求头获取
        const headerToken = request.headers.get('X-CSRF-Token');
        if (headerToken) {
            return headerToken;
        }

        // 从表单数据获取
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/x-www-form-urlencoded') || 
            contentType.includes('multipart/form-data')) {
            // 这需要在调用处解析FormData后获取
            return null;
        }

        return null;
    }

    // 生成安全的会话ID
    async generateSessionId() {
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

export { CSRFProtection };