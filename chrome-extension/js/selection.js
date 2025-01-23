class SelectionManager {
    constructor() {
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.selectionBox = null;
        this.overlay = null;
        
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    createOverlay() {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'ocr-overlay';
        document.body.appendChild(this.overlay);
        this.overlay.addEventListener('mousedown', this.onMouseDown);
    }

    createSelectionBox() {
        if (this.selectionBox) return;
        
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'ocr-selection-box';
        document.body.appendChild(this.selectionBox);
    }

    cleanup() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.isSelecting = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        this.createSelectionBox();
        
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(this.startX, currentX);
        const top = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    onMouseUp(e) {
        if (!this.isSelecting) return;
        
        const rect = {
            left: parseInt(this.selectionBox.style.left),
            top: parseInt(this.selectionBox.style.top),
            width: parseInt(this.selectionBox.style.width),
            height: parseInt(this.selectionBox.style.height),
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            devicePixelRatio: window.devicePixelRatio
        };
        
        if (rect.width > 10 && rect.height > 10) {
            chrome.runtime.sendMessage({
                action: 'processCapture',
                rect: rect
            });
        }
        
        this.cleanup();
    }

    start() {
        this.cleanup();
        this.createOverlay();
    }
}

const selectionManager = new SelectionManager();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSelection') {
        selectionManager.start();
        sendResponse({ success: true });
    }
}); 