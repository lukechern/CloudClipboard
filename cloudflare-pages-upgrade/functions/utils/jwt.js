// JWT工具函数
// 使用Web Crypto API实现JWT签名和验证

class JWTUtils {
    constructor(secret) {
        this.secret = secret;
        this.algorithm = 'HS256';
    }

    // 生成JWT token
    async generateToken(payload, expiresIn = '7d') {
        const header = {
            alg: this.algorithm,
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const exp = now + this.parseExpiration(expiresIn);

        const jwtPayload = {
            ...payload,
            iat: now,
            exp: exp
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));
        
        const signature = await this.sign(`${encodedHeader}.${encodedPayload}`);
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // 验证JWT token
    async verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const [encodedHeader, encodedPayload, signature] = parts;
            
            // 验证签名
            const expectedSignature = await this.sign(`${encodedHeader}.${encodedPayload}`);
            if (signature !== expectedSignature) {
                throw new Error('Invalid signature');
            }

            // 解码payload
            const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
            
            // 检查过期时间
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                throw new Error('Token expired');
            }

            return payload;
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    // 生成签名
    async sign(data) {
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

    // 解析过期时间
    parseExpiration(expiresIn) {
        if (typeof expiresIn === 'number') {
            return expiresIn;
        }

        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid expiration format');
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        const multipliers = {
            s: 1,
            m: 60,
            h: 60 * 60,
            d: 60 * 60 * 24
        };

        return value * multipliers[unit];
    }
}

export { JWTUtils };