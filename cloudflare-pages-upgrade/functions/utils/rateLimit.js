// 速率限制工具
// 使用Cloudflare KV存储访问记录

class RateLimiter {
    constructor(env) {
        this.env = env;
        this.kvNamespace = env.RATE_LIMIT_KV || null;
    }

    // 检查速率限制
    async checkRateLimit(identifier, options = {}) {
        const {
            maxAttempts = 5,           // 最大尝试次数
            windowMs = 15 * 60 * 1000, // 时间窗口（15分钟）
            blockDurationMs = 60 * 60 * 1000 // 封锁时长（1小时）
        } = options;

        if (!this.kvNamespace) {
            // 如果没有配置KV，则不进行速率限制
            return { allowed: true, remaining: maxAttempts };
        }

        const key = `rate_limit:${identifier}`;
        const now = Date.now();

        try {
            // 获取当前记录
            const recordStr = await this.kvNamespace.get(key);
            let record = recordStr ? JSON.parse(recordStr) : null;

            // 如果没有记录或记录已过期，创建新记录
            if (!record || now - record.windowStart > windowMs) {
                record = {
                    attempts: 0,
                    windowStart: now,
                    blockedUntil: null
                };
            }

            // 检查是否在封锁期内
            if (record.blockedUntil && now < record.blockedUntil) {
                const remainingBlockTime = Math.ceil((record.blockedUntil - now) / 1000);
                return {
                    allowed: false,
                    blocked: true,
                    remainingBlockTime,
                    message: `访问被暂时限制，请在 ${remainingBlockTime} 秒后重试`
                };
            }

            // 检查是否超过限制
            if (record.attempts >= maxAttempts) {
                // 设置封锁时间
                record.blockedUntil = now + blockDurationMs;
                await this.kvNamespace.put(key, JSON.stringify(record), {
                    expirationTtl: Math.ceil((blockDurationMs + windowMs) / 1000)
                });

                const remainingBlockTime = Math.ceil(blockDurationMs / 1000);
                return {
                    allowed: false,
                    blocked: true,
                    remainingBlockTime,
                    message: `尝试次数过多，访问被限制 ${remainingBlockTime} 秒`
                };
            }

            return {
                allowed: true,
                remaining: maxAttempts - record.attempts,
                windowStart: record.windowStart
            };

        } catch (error) {
            console.error('Rate limit check failed:', error);
            // 如果检查失败，允许访问（降级处理）
            return { allowed: true, remaining: maxAttempts };
        }
    }

    // 记录访问尝试
    async recordAttempt(identifier, success = false, options = {}) {
        const {
            maxAttempts = 5,
            windowMs = 15 * 60 * 1000,
            blockDurationMs = 60 * 60 * 1000
        } = options;

        if (!this.kvNamespace) {
            return;
        }

        const key = `rate_limit:${identifier}`;
        const now = Date.now();

        try {
            const recordStr = await this.kvNamespace.get(key);
            let record = recordStr ? JSON.parse(recordStr) : null;

            if (!record || now - record.windowStart > windowMs) {
                record = {
                    attempts: 0,
                    windowStart: now,
                    blockedUntil: null
                };
            }

            if (success) {
                // 成功时重置计数器
                record.attempts = 0;
                record.blockedUntil = null;
            } else {
                // 失败时增加计数器
                record.attempts += 1;
            }

            // 更新记录
            await this.kvNamespace.put(key, JSON.stringify(record), {
                expirationTtl: Math.ceil((blockDurationMs + windowMs) / 1000)
            });

        } catch (error) {
            console.error('Failed to record attempt:', error);
        }
    }

    // 清除限制记录
    async clearLimit(identifier) {
        if (!this.kvNamespace) {
            return;
        }

        const key = `rate_limit:${identifier}`;
        try {
            await this.kvNamespace.delete(key);
        } catch (error) {
            console.error('Failed to clear rate limit:', error);
        }
    }

    // 获取客户端标识符
    static getClientIdentifier(request) {
        // 优先使用CF-Connecting-IP（Cloudflare提供的真实IP）
        const cfIP = request.headers.get('CF-Connecting-IP');
        if (cfIP) {
            return cfIP;
        }

        // 备用方案：使用X-Forwarded-For
        const forwardedFor = request.headers.get('X-Forwarded-For');
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }

        // 最后备用：使用请求的远程地址
        return request.headers.get('X-Real-IP') || 'unknown';
    }
}

export { RateLimiter };