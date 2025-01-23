// Função para capturar a área selecionada
async function captureArea(rect) {
    const canvas = await html2canvas(document.body, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        scrollX: rect.scrollX,
        scrollY: rect.scrollY,
        scale: rect.devicePixelRatio
    });
    return canvas.toDataURL('image/png');
}

// Função para processar OCR
async function processOCR(imageData) {
    const result = await Tesseract.recognize(imageData, 'por+eng');
    return result.data.text.trim();
}

// Função para copiar texto
async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    return true;
} 