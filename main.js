import { initializeUI, updateRecordCount } from './modules/ui-controller.js';
import { loadSampleData } from './modules/data-handler.js';
import { renderAllPages, renderPreviewPair } from './modules/card-generator.js';

// --- Password Protection Logic ---
// Stored hash of the password "Hitster101"
const PWD_HASH = 'b677339242835f85514f7b60098418034032069ee5b1933c099309859f518e38';

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const enteredPassword = passwordInput.value;
    const enteredHash = await sha256(enteredPassword);

    if (enteredHash === PWD_HASH) {
        const landingPage = document.getElementById('landing-page');
        landingPage.style.opacity = '0';
        setTimeout(() => {
            landingPage.classList.add('hidden');
            document.getElementById('settings-panel').classList.remove('app-hidden');
            document.getElementById('main-content').classList.remove('app-hidden');
            App.init(); // Initialize the main application
        }, 500);
    } else {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('hidden');
        passwordInput.value = '';
        setTimeout(() => errorMessage.classList.add('hidden'), 2000);
    }
}
// --- End of Password Logic ---


const App = {
    data: [],
    previewIntervalId: null,
    currentPreviewIndex: 0, 
    isExternalDataLoaded: false,

    async init() {
        try {
            this.data = await loadSampleData();
            
            initializeUI(
                (fullReload) => this.handleSettingsChange(fullReload),
                (d) => this.handleDataLoaded(d)
            );
            
            const isToken = document.getElementById('mode-token')?.checked;
            
            if (isToken || (this.data && this.data.length > 0)) {
                this.updateStats(); 
                this.renderPrintView();
                this.startPreviewCycle();
                
                document.getElementById('preview-area').addEventListener('click', (e) => {
                    const cardWrapper = e.target.closest('.card-wrapper');
                    
                    if (cardWrapper) {
                        if (cardWrapper.classList.contains('zoomed-card')) {
                            cardWrapper.classList.remove('zoomed-card');
                            this.startPreviewCycle(); 
                        } else {
                            document.querySelectorAll('.card-wrapper.zoomed-card').forEach(el => el.classList.remove('zoomed-card'));
                            cardWrapper.classList.add('zoomed-card');
                            if (this.previewIntervalId) clearInterval(this.previewIntervalId);
                        }
                    } else {
                        const anyZoomed = document.querySelector('.card-wrapper.zoomed-card');
                        if (anyZoomed) {
                             anyZoomed.classList.remove('zoomed-card');
                             this.startPreviewCycle();
                        } else {
                            this.showNextPreview();
                            this.resetCycle();
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Init error:", error);
        }
    },

    handleSettingsChange(fullReload = false) {
        if (fullReload) {
            this.renderPrintView();
        }
        this.refreshCurrentPreview();
    },

    handleDataLoaded(newData) {
        if (!newData || newData.length === 0) return;
        this.data = newData;
        this.isExternalDataLoaded = true;
        this.updateStats();
        this.renderPrintView();
        this.currentPreviewIndex = 0;
        this.refreshCurrentPreview();
        this.resetCycle();
    },

    updateStats() {
        const isToken = document.getElementById('mode-token')?.checked;
        if (isToken) {
             // Future: Show token stats if needed
        } else {
             updateRecordCount(this.data.length, this.isExternalDataLoaded);
        }
    },

    renderPrintView() {
        const isToken = document.getElementById('mode-token')?.checked;
        if (!isToken && (!this.data || this.data.length === 0)) return;
        
        const printArea = document.getElementById('print-area');
        renderAllPages(printArea, this.data);
    },

    showNextPreview() {
        const isToken = document.getElementById('mode-token')?.checked;
        if (!isToken && (!this.data || this.data.length === 0)) return;
        
        if (document.querySelector('.zoomed-card')) return;

        if (!isToken) {
            this.currentPreviewIndex = (this.currentPreviewIndex + 1) % this.data.length;
        }
        this.refreshCurrentPreview();
    },

    refreshCurrentPreview() {
        const isToken = document.getElementById('mode-token')?.checked;
        if (!isToken && (!this.data || this.data.length === 0)) return;
        
        const previewArea = document.getElementById('preview-area');
        renderPreviewPair(previewArea, this.data[this.currentPreviewIndex]);
    },

    resetCycle() {
        this.startPreviewCycle();
    },

    startPreviewCycle() {
        if (this.previewIntervalId) clearInterval(this.previewIntervalId);
        this.refreshCurrentPreview();
        this.previewIntervalId = setInterval(() => {
            this.showNextPreview();
        }, 8000); 
    }
};

// Initial document load setup
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('loading'); // Show landing page
    
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');

    loginButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
});