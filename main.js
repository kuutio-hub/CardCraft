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
    sourceName: 'CardCraft',
    previewIntervalId: null,
    currentPreviewIndex: 0, 
    isExternalDataLoaded: false,
    validationCancelled: false,

    async init() {
        try {
            this.data = await loadSampleData();
            
            initializeUI(
                (fullReload) => this.handleSettingsChange(fullReload),
                (d, source) => this.handleDataLoaded(d, source),
                () => this.validateYearsWithMusicBrainz(),
                () => this.downloadDataAsXLS(),
                () => this.isExternalDataLoaded,
                (url) => this.handleSpotifyImport(url),
                () => this.handlePrint()
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
            const { tracks, name } = await spotifyHandler.fetchSpotifyData(url);
            
            if (tracks && tracks.length > 0) {
                this.handleDataLoaded(tracks, name);
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
                validatedData.push(track);
            } else {
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
        
        this.handleDataLoaded(validatedData, this.sourceName);
    },
    
    generatePrintFilename() {
        const source = this.sourceName.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
        const paper = document.getElementById('paper-size').value;
        const now = new Date();
        const date = now.toLocaleDateString('hu-HU', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\.\s/g, '').replace(/\./g, '');
        const time = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
        return `${source}_${paper}_${date}_${time}`;
    },

    handlePrint() {
        document.body.classList.add('grid-view-active');
        document.body.classList.add('is-printing'); 
        this.handleSettingsChange(true);
        
        const originalTitle = document.title;
        document.title = this.generatePrintFilename();

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('is-printing');
                document.title = originalTitle;
                this.handleSettingsChange(true); 
            }, 1000);
        }, 800);
    },

    handleSettingsChange(fullReload = false) {
        if (fullReload) {
            this.renderPrintView();
        }
        this.refreshCurrentPreview();
    },

    handleDataLoaded(newData, source = null) {
        if (!newData) return;
        this.data = newData;
        this.isExternalDataLoaded = newData.length > 0;
        
        if (source) {
            // Remove file extension for cleaner name
            this.sourceName = source.includes('.') ? source.split('.').slice(0, -1).join('.') : source;
        } else if (!this.sourceName) {
            this.sourceName = 'CardCraft_Import';
        }

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
        } else {
             updateRecordCount(this.data.length, this.isExternalDataLoaded);
        }
    },

    renderPrintView() {
        const isToken = document.getElementById('mode-token')?.checked;
        const printArea = document.getElementById('print-area');
        
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
            previewArea.innerHTML = '';
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

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('loading');
    
    const loginButton = document.getElementById('login-button');
    const accessCodeInput = document.getElementById('access-code-input');

    loginButton.addEventListener('click', checkAccessCode);
    accessCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAccessCode();
        }
    });
});