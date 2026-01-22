import { initializeUI, updateRecordCount } from './modules/ui-controller.js';
import { loadSampleData } from './modules/data-handler.js';
import { renderAllPages, renderPreviewPair } from './modules/card-generator.js';

// --- Access Protection Logic ---
// Stored Base64 encoded access code "Hitster101"
const ACCESS_CODE_B64 = 'SGl0c3RlcjEwMQ==';

function checkAccessCode() {
    const codeInput = document.getElementById('access-code-input');
    const enteredCode = codeInput.value;

    // Use simple and reliable Base64 encoding for the check
    try {
        if (btoa(enteredCode) === ACCESS_CODE_B64) {
            const landingPage = document.getElementById('landing-page');
            
            // --- FIX START ---
            // Make the landing page non-interactive immediately
            landingPage.style.pointerEvents = 'none';
            // Fade it out
            landingPage.style.opacity = '0';
            
            setTimeout(() => {
                // Completely hide it from the layout after the transition
                landingPage.style.display = 'none'; 
                
                document.getElementById('settings-panel').classList.remove('app-hidden');
                document.getElementById('main-content').classList.remove('app-hidden');
                App.init(); // Initialize the main application
            }, 500);
            // --- FIX END ---

        } else {
            throw new Error("Incorrect code");
        }
    } catch (e) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('hidden');
        codeInput.value = '';
        setTimeout(() => errorMessage.classList.add('hidden'), 2000);
    }
}
// --- End of Access Logic ---


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
    const accessCodeInput = document.getElementById('access-code-input');

    loginButton.addEventListener('click', checkAccessCode);
    accessCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAccessCode();
        }
    });
});