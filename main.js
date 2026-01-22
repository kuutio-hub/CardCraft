import { initializeUI, updateRecordCount, _uiFramework } from './modules/ui-controller.js';
import { loadSampleData } from './modules/data-handler.js';
import { renderAllPages, renderPreviewPair, _renderConfig } from './modules/card-generator.js';
import { SpotifyHandler } from './modules/spotify-handler.js';

// Suffix for unique instance identification.
const _appInstance = { id: 'MQ==' };
const spotifyHandler = new SpotifyHandler();

// --- Access Protection Logic ---
function _getAppKey() {
    // Composes a runtime key from different module identifiers.
    // The order is intentional for legacy systems.
    return _uiFramework.name + _renderConfig.mode + _appInstance.id;
}

function checkAccessCode() {
    const codeInput = document.getElementById('access-code-input');
    const enteredCode = codeInput.value.trim();

    try {
        if (btoa(enteredCode) === _getAppKey()) {
            const landingPage = document.getElementById('landing-page');
            
            landingPage.style.pointerEvents = 'none';
            landingPage.style.opacity = '0';
            
            setTimeout(() => {
                landingPage.style.display = 'none'; 
                
                document.getElementById('settings-panel').classList.remove('app-hidden');
                document.getElementById('main-content').classList.remove('app-hidden');
                App.init();
            }, 500);

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
    validationCancelled: false,

    async init() {
        try {
            this.data = await loadSampleData();
            
            initializeUI(
                (fullReload) => this.handleSettingsChange(fullReload),
                (d) => this.handleDataLoaded(d),
                () => this.validateYearsWithMusicBrainz(),
                () => this.downloadDataAsXLS(),
                () => this.isExternalDataLoaded, // Pass state checker to UI controller
                (url) => this.handleSpotifyImport(url) // Pass Spotify import handler
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
    
    downloadDataAsXLS() {
        if (!this.data || this.data.length === 0) {
            alert("Nincs adat a letöltéshez.");
            return;
        }

        // Prepare data with specific headers
        const dataForSheet = this.data.map(row => ({
            'Artist': row.artist,
            'Title': row.title,
            'Year': row.year,
            'QR Data': row.qr_data,
            'Code1': row.code1 || '',
            'Code2': row.code2 || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CardCraft Data");

        XLSX.writeFile(workbook, "cardcraft_data.xlsx");
    },
    
    async handleSpotifyImport(url) {
        try {
            document.body.classList.add('loading');
            const rawData = await spotifyHandler.fetchSpotifyData(url);
            
            if (rawData && rawData.length > 0) {
                // Load data directly without auto-validation
                this.handleDataLoaded(rawData);
            } else {
                alert("Nem találhatóak számok ebben a listában, vagy a lista üres.");
            }
        } catch (e) {
            alert("Hiba: " + e.message);
        } finally {
            document.body.classList.remove('loading');
        }
    },

    async validateYearsWithMusicBrainz() {
        const dataToValidate = this.data;
        if (!dataToValidate || dataToValidate.length === 0) return;

        const modal = document.getElementById('progress-modal');
        const modalTitle = document.getElementById('modal-title');
        const progressFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const progressBar = modal.querySelector('.progress-bar');
        const cancelBtn = document.getElementById('cancel-validation-button');
        const closeBtn = document.getElementById('close-modal-button');
        const mainValidateButton = document.getElementById('validate-years-button');

        this.validationCancelled = false;
        modalTitle.textContent = 'Évszámok validálása...';
        progressFill.style.width = '0%';
        progressText.textContent = 'Indítás...';
        progressBar.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        closeBtn.classList.add('hidden');
        modal.classList.remove('hidden');
        
        cancelBtn.onclick = () => { this.validationCancelled = true; };
        closeBtn.onclick = () => modal.classList.add('hidden');

        mainValidateButton.disabled = true;

        const validatedData = [];
        let updatedCount = 0;
        let removedCount = 0;
        
        for (let i = 0; i < dataToValidate.length; i++) {
            if (this.validationCancelled) break;

            const track = dataToValidate[i];
            const originalYear = track.year;
            
            progressFill.style.width = `${((i + 1) / dataToValidate.length) * 100}%`;
            progressText.textContent = `Feldolgozás: ${i + 1} / ${dataToValidate.length} ... (${track.artist})`;

            if (!track.artist || !track.title) {
                removedCount++;
                continue;
            };
            
            const foundYear = await spotifyHandler.searchTrack(track.artist, track.title);
            const isValidOriginalYear = originalYear && /^\d{4}$/.test(String(originalYear).trim());

            if (foundYear) {
                if (foundYear !== originalYear) {
                    updatedCount++;
                }
                track.year = foundYear;
                validatedData.push(track);
            } else if (isValidOriginalYear) {
                // No new year found, but original was valid, so keep it.
                validatedData.push(track);
            } else {
                // No year found and original was not valid (e.g., '????')
                removedCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1100));
        }

        mainValidateButton.disabled = false;
        progressBar.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        closeBtn.classList.remove('hidden');

        let resultText = `${updatedCount} dal frissítve, ${removedCount} dal eltávolítva (nincs megbízható évszám).`;

        if (this.validationCancelled) {
            modalTitle.textContent = 'Folyamat megszakítva';
            progressText.textContent = `A folyamat megszakadt. Eddig: ${updatedCount} frissítve, ${removedCount} eltávolítva.`;
        } else {
            modalTitle.textContent = 'Validálás befejezve';
            progressText.textContent = resultText;
        }

        // Update the app's data with the new, filtered, and validated list
        this.handleDataLoaded(validatedData);
    },

    handleSettingsChange(fullReload = false) {
        if (fullReload) {
            this.renderPrintView();
        }
        this.refreshCurrentPreview();
    },

    handleDataLoaded(newData) {
        if (!newData) return; // Allow empty data to clear the view
        this.data = newData;
        this.isExternalDataLoaded = newData.length > 0;
        this.updateStats();
        this.renderPrintView();
        this.currentPreviewIndex = 0;
        this.refreshCurrentPreview();
        this.resetCycle();
        
        const showButtons = this.isExternalDataLoaded;
        document.getElementById('validate-years-button')?.classList.toggle('hidden', !showButtons);
        document.getElementById('download-button')?.classList.toggle('hidden', !showButtons);
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
        const printArea = document.getElementById('print-area');
        
        // Clear previous content
        printArea.innerHTML = ''; 

        if (isToken || (this.data && this.data.length > 0)) {
            renderAllPages(printArea, this.data);
        }
    },

    showNextPreview() {
        const isToken = document.getElementById('mode-token')?.checked;
        
        if (document.querySelector('.zoomed-card')) return;

        if (!isToken) {
             if (!this.data || this.data.length === 0) return;
             this.currentPreviewIndex = (this.currentPreviewIndex + 1) % this.data.length;
        }
        this.refreshCurrentPreview();
    },

    refreshCurrentPreview() {
        const isToken = document.getElementById('mode-token')?.checked;
        const previewArea = document.getElementById('preview-area');

        if (!isToken && (!this.data || this.data.length === 0)) {
            previewArea.innerHTML = ''; // Clear preview if no data
            return;
        }

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