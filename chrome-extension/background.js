// Função para carregar o conteúdo de um arquivo
async function loadFile(filename) {
    try {
        const response = await fetch(chrome.runtime.getURL(filename));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Erro ao carregar ${filename}:`, error);
        throw error;
    }
}

// Função para injetar script na página
async function injectScript(tabId, code) {
    return chrome.scripting.executeScript({
        target: { tabId },
        func: (scriptContent) => {
            const script = document.createElement('script');
            script.textContent = scriptContent;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        },
        args: [code]
    });
}

// Função para injetar scripts em uma aba
async function injectScriptsIntoTab(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId },
        files: ['libs/html2canvas.min.js']
    });

    await chrome.scripting.executeScript({
        target: { tabId },
        files: ['libs/tesseract.min.js']
    });
}

// Função para processar a captura
async function processCapture(tabId, rect) {
    return chrome.scripting.executeScript({
        target: { tabId },
        files: ['capture-helper.js']
    }).then(() => {
        return chrome.scripting.executeScript({
            target: { tabId },
            function: (rect) => window.captureAndProcess(rect),
            args: [rect]
        });
    });
}

async function executeScriptWithLibrary(tabId, libraryPath, code) {
    // Primeiro, carrega a biblioteca
    const libraryResponse = await fetch(chrome.runtime.getURL(libraryPath));
    const libraryCode = await libraryResponse.text();
    
    // Executa a biblioteca e o código
    return chrome.scripting.executeScript({
        target: { tabId },
        func: (library, userCode) => {
            // Avalia a biblioteca no contexto da página
            const scriptElement = document.createElement('script');
            scriptElement.textContent = library;
            document.documentElement.appendChild(scriptElement);
            scriptElement.remove();
            
            // Executa o código do usuário
            return eval(userCode);
        },
        args: [libraryCode, code]
    });
}

// Listener para mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectScripts') {
        injectScriptsIntoTab(sender.tab.id)
            .then(() => sendResponse({ success: true }))
            .catch((error) => {
                console.error('Erro ao injetar scripts:', error);
                sendResponse({ success: false });
            });
        return true;
    }

    if (request.action === 'processCapture') {
        const rect = request.rect;
        const tabId = sender.tab.id;

        // Captura a tela visível
        chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 })
            .then(screenshotUrl => {
                // Injeta os scripts necessários
                return chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['js/tesseract.min.js']
                }).then(() => {
                    // Processa a imagem
                    return chrome.scripting.executeScript({
                        target: { tabId },
                        func: (url, r) => {
                            return new Promise((resolve, reject) => {
                                const img = new Image();
                                img.crossOrigin = 'anonymous';
                                
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    
                                    const scale = 2;
                                    canvas.width = r.width * scale;
                                    canvas.height = r.height * scale;
                                    
                                    ctx.imageSmoothingEnabled = true;
                                    ctx.imageSmoothingQuality = 'high';
                                    
                                    ctx.drawImage(
                                        img,
                                        r.left,
                                        r.top,
                                        r.width,
                                        r.height,
                                        0,
                                        0,
                                        canvas.width,
                                        canvas.height
                                    );
                                    
                                    resolve(canvas.toDataURL('image/png', 1.0));
                                };
                                
                                img.onerror = () => reject(new Error('Falha ao carregar imagem'));
                                img.src = url;
                            });
                        },
                        args: [screenshotUrl, rect]
                    });
                });
            })
            .then(([imageResult]) => {
                if (!imageResult || !imageResult.result) {
                    throw new Error('Falha ao processar imagem');
                }
                
                // Processa o OCR
                return chrome.scripting.executeScript({
                    target: { tabId },
                    func: (imageData) => {
                        return Tesseract.recognize(
                            imageData,
                            'por+eng',
                            {
                                logger: () => {},
                                errorHandler: (err) => console.error('Erro Tesseract:', err)
                            }
                        ).then(result => {
                            if (!result || !result.data || !result.data.text) {
                                throw new Error('OCR não retornou texto');
                            }
                            return result.data.text.trim();
                        });
                    },
                    args: [imageResult.result]
                });
            })
            .then(([textResult]) => {
                if (!textResult || !textResult.result) {
                    throw new Error('OCR retornou resultado vazio');
                }
                
                // Copia para a área de transferência
                return chrome.scripting.executeScript({
                    target: { tabId },
                    func: (text) => {
                        return navigator.clipboard.writeText(text)
                            .then(() => {
                                // Mostra notificação
                                const div = document.createElement('div');
                                div.className = 'ocr-notification';
                                div.textContent = 'Texto copiado para a área de transferência!';
                                document.body.appendChild(div);
                                setTimeout(() => div.remove(), 3000);
                            });
                    },
                    args: [textResult.result]
                });
            })
            .catch(error => {
                console.error('Erro:', error);
                chrome.scripting.executeScript({
                    target: { tabId },
                    func: (errorMsg) => {
                        const div = document.createElement('div');
                        div.className = 'ocr-notification';
                        div.style.background = '#f44336';
                        div.textContent = 'Erro: ' + errorMsg;
                        document.body.appendChild(div);
                        setTimeout(() => div.remove(), 3000);
                    },
                    args: [error.toString()]
                });
            });

        return true;
    }
});
