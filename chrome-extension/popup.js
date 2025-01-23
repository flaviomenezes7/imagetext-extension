document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startCapture');
    if (startButton) {
        startButton.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'startSelection'})
                    .then(() => window.close())
                    .catch(err => console.error('Erro ao iniciar seleção:', err));
            });
        });
    }
});
