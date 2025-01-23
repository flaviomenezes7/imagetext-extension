// Função para capturar a área
window.captureArea = async function(rect) {
    try {
        // Aguarda um pequeno delay para garantir que a página esteja estável
        await new Promise(resolve => setTimeout(resolve, 500));

        // Cria um elemento div para capturar apenas a área selecionada
        const captureDiv = document.createElement('div');
        captureDiv.style.position = 'absolute';
        captureDiv.style.left = rect.left + 'px';
        captureDiv.style.top = rect.top + 'px';
        captureDiv.style.width = rect.width + 'px';
        captureDiv.style.height = rect.height + 'px';
        captureDiv.style.overflow = 'hidden';
        
        // Clona o conteúdo da área selecionada
        const content = document.elementFromPoint(rect.left + (rect.width / 2), rect.top + (rect.height / 2));
        if (content) {
            captureDiv.appendChild(content.cloneNode(true));
        }
        
        document.body.appendChild(captureDiv);

        // Configurações do html2canvas
        const options = {
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
            scale: 2,
            logging: false,
            removeContainer: true,
            backgroundColor: '#ffffff'
        };

        // Captura apenas o div criado
        const canvas = await html2canvas(captureDiv, options);
        
        // Remove o div temporário
        document.body.removeChild(captureDiv);

        // Converte para PNG com qualidade máxima
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        console.log('Captura realizada com sucesso');
        return dataUrl;
    } catch (error) {
        console.error('Erro na captura:', error);
        throw error;
    }
};

// Função para processar OCR
window.processOCR = async function(imageData) {
    try {
        if (!imageData) {
            throw new Error('Imagem não fornecida');
        }

        console.log('Iniciando OCR...');
        
        // Configurações do Tesseract
        const config = {
            lang: 'por+eng',
            logger: m => console.log(m),
            workerPath: chrome.runtime.getURL('js/worker.min.js'),
            corePath: chrome.runtime.getURL('js/tesseract-core.wasm.js'),
            langPath: chrome.runtime.getURL('js/lang-data'),
            errorHandler: (err) => console.error('Erro Tesseract:', err)
        };

        const result = await Tesseract.recognize(imageData, config);

        if (!result || !result.data || !result.data.text) {
            throw new Error('OCR não retornou resultados');
        }

        const text = result.data.text.trim();
        console.log('OCR concluído:', text);
        return text;
    } catch (error) {
        console.error('Erro no OCR:', error);
        throw error;
    }
}; 