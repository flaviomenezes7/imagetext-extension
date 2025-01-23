if (typeof CaptureUtils === 'undefined') {
    class CaptureUtils {
        static async processImage(imageUrl, rect) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const scale = 2;
                    canvas.width = rect.width * scale;
                    canvas.height = rect.height * scale;
                    
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(
                        img,
                        rect.left,
                        rect.top,
                        rect.width,
                        rect.height,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );
                    
                    resolve(canvas.toDataURL('image/png', 1.0));
                };
                
                img.onerror = () => reject(new Error('Falha ao carregar imagem'));
                img.src = imageUrl;
            });
        }

        static async processOCR(imageData) {
            try {
                const result = await Tesseract.recognize(imageData, 'por+eng');
                const text = result?.data?.text?.trim();
                
                if (!text) {
                    throw new Error('OCR não retornou texto');
                }
                
                return text;
            } catch (error) {
                console.error('Erro no OCR:', error);
                throw error;
            }
        }

        static async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.error('Erro ao copiar:', error);
                throw error;
            }
        }

        static showNotification(message) {
            const div = document.createElement('div');
            div.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px;
                background: #4CAF50;
                color: white;
                border-radius: 5px;
                z-index: 999999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            div.textContent = message;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 3000);
        }
    }
} 