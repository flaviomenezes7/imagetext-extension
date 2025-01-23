// Função para processar OCR
window.processOCR = function(imageData) {
    const config = {
        lang: 'por+eng',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?@#$%&*()+-=/ ',
        tessedit_ocr_engine_mode: 1,
        preserve_interword_spaces: 1,
        tessedit_pageseg_mode: 6
    };

    return Tesseract.recognize(imageData, config)
        .then(result => {
            if (!result || !result.data || !result.data.text) {
                throw new Error('OCR não retornou texto');
            }
            return result.data.text.trim();
        });
}

// Função para processar imagem
window.processImage = function(imageUrl, rect) {
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
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const threshold = 128;
                const newValue = avg > threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = newValue;
            }
            ctx.putImageData(imageData, 0, 0);
            
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = imageUrl;
    });
} 