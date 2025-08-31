// 图片处理和缩略图生成功能
class ImageProcessor {
    constructor() {
        // 图片处理配置
        this.config = {
            thumbnailMaxWidth: 200,
            thumbnailMaxHeight: 200,
            thumbnailQuality: 0.8
        };
    }

    async processImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('无效的图片文件');
        }

        try {
            // 转换为base64
            const base64 = await this.fileToBase64(file);
            
            // 生成缩略图
            const thumbnail = await this.generateThumbnail(
                file, 
                this.config.thumbnailMaxWidth, 
                this.config.thumbnailMaxHeight,
                this.config.thumbnailQuality
            );
            
            return {
                id: Date.now() + Math.random(),
                file: file,
                base64: base64,           // 原图
                thumbnail: thumbnail,     // 缩略图
                type: file.type,
                size: file.size
            };
            
        } catch (error) {
            console.error('处理图片失败:', error);
            throw error;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 生成缩略图
    generateThumbnail(file, maxWidth = 200, maxHeight = 200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // 计算缩略图尺寸，保持宽高比
                let { width, height } = this.calculateThumbnailSize(
                    img.width, img.height, maxWidth, maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制缩略图
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为base64
                const thumbnailBase64 = canvas.toDataURL(file.type, quality);
                resolve(thumbnailBase64);
                
                // 清理URL
                URL.revokeObjectURL(img.src);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('无法加载图片'));
            };
            
            // 从文件创建图片URL
            const url = URL.createObjectURL(file);
            img.src = url;
        });
    }

    // 计算缩略图尺寸，保持宽高比
    calculateThumbnailSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // 如果图片尺寸小于最大尺寸，直接返回原尺寸
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }
        
        // 计算缩放比例
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}