import { initializeUI, updateRecordCount } from './modules/ui-controller.js';
import { loadSampleData } from './modules/data-handler.js';
import { renderAllPages, renderPreviewPair, renderAllPagesWithProgress } from './modules/card-generator.js';
import { SpotifyHandler } from './modules/spotify-handler.js';
import { YoutubeHandler } from './modules/youtube-handler.js';
import { DiscogsHandler } from './modules/discogs-handler.js';
import { showNotification } from './modules/notifier.js';

const spotifyHandler = new SpotifyHandler();
const youtubeHandler = new YoutubeHandler();


// --- Access Protection Logic ---
const ACCESS_KEY = 'Hitster101';

function checkAccessCode() {
    const codeInput = document.getElementById('access-code-input');
    const enteredCode = codeInput.value.trim();

    if (enteredCode.toLowerCase() === ACCESS_KEY.toLowerCase()) {
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
                () => this.validateYearsWithDiscogs(),
                () => this.downloadDataAsXLS(),
                () => this.isExternalDataLoaded,
                (url) => this.handleSpotifyImport(url),
                (url) => this.handleYouTubeImport(url),
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
            alert(`Inicializálási Hiba:\n\n${error.message}`);
        }
    },
    
    generateDataFilename() {
        const source = this.sourceName.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
        const now = new Date();
        const date = now.toLocaleDateString('hu-HU', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\.\s/g, '').replace(/\./g, '');
        const time = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
        return `${source}_data_${date}_${time}.xlsx`;
    },

    downloadDataAsXLS() {
        if (!this.data || this.data.length === 0) {
            alert('Hiba: Nincs adat a letöltéshez.');
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

        XLSX.writeFile(workbook, this.generateDataFilename());
    },

    async handleYouTubeImport(url) {
        const modal = document.getElementById('progress-modal');
        const modalTitle = document.getElementById('modal-title');
        const progressText = document.getElementById('progress-text');
        const progressBar = modal.querySelector('.progress-bar');
        const cancelBtn = document.getElementById('cancel-validation-button');
        const closeBtn = document.getElementById('close-modal-button');
        try {
            modalTitle.textContent = 'YouTube adatok betöltése...';
            progressText.textContent = 'Lejátszási lista elemzése...';
            progressBar.classList.add('hidden');
            cancelBtn.classList.add('hidden');
            closeBtn.classList.add('hidden');
            modal.classList.remove('hidden');

            const progressCallback = (page) => {
                 progressText.textContent = `${page}. oldal feldgozása...`;
            };

            const { tracks, name } = await youtubeHandler.fetchYouTubeData(url, progressCallback);
            
            if (tracks && tracks.length > 0) {
                this.handleDataLoaded(tracks, name);
                showNotification('Sikeres Import', `${tracks.length} videó betöltve a(z) "${name}" listából.`, 'success');
            } else {
                alert('Hiba: Nem találhatóak videók ebben a listában, vagy a lista üres.');
            }
        } catch (e) {
            alert(`YouTube Hiba:\n\n${e.message}`);
        } finally {
            modal.classList.add('hidden');
        }
    },
    
    async handleSpotifyImport(url) {
        const modal = document.getElementById('progress-modal');
        const modalTitle = document.getElementById('modal-title');
        const progressText = document.getElementById('progress-text');
        const progressBar = modal.querySelector('.progress-bar');
        const cancelBtn = document.getElementById('cancel-validation-button');
        const closeBtn = document.getElementById('close-modal-button');
        try {
            modalTitle.textContent = 'Spotify adatok betöltése...';
            progressText.textContent = 'Kapcsolódás a Spotify API-hoz...';
            progressBar.classList.add('hidden');
            cancelBtn.classList.add('hidden');
            closeBtn.classList.add('hidden');
            modal.classList.remove('hidden');

            const { tracks, name } = await spotifyHandler.fetchSpotifyData(url);
            
            if (tracks && tracks.length > 0) {
                this.handleDataLoaded(tracks, name);
                showNotification('Sikeres Import', `${tracks.length} dal betöltve a(z) "${name}" listából.`, 'success');
            } else {
                alert('Hiba: Nem találhatóak számok ebben a listában, vagy a lista üres.');
            }
        } catch (e) {
            alert(`Spotify Hiba:\n\n${e.message}`);
        } finally {
            modal.classList.add('hidden');
        }
    },

    async validateYearsWithDiscogs() {
        const dataToValidate = this.data;
        if (!dataToValidate || dataToValidate.length === 0) return;

        const discogsKey = localStorage.getItem('cardcraft_discogs_key');
        const discogsSecret = localStorage.getItem('cardcraft_discogs_secret');

        if (!discogsKey || !discogsSecret) {
            alert('Hiba: Nincsenek beállítva a Discogs API kulcsok!');
            return;
        }

        const estimatedSeconds = dataToValidate.length * 2.5;
        const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
        
        const confirmation = confirm(
            `Ez a folyamat a Discogs API sebességkorlátja miatt lassú lesz.\n\n` +
            `Feldolgozandó dalok: ${dataToValidate.length} db\n` +
            `Várható időtartam: kb. ${estimatedMinutes} perc\n\n` +
            `A folyamat a háttérben fut, de a fül elhagyása megszakíthatja. Folytatja?`
        );

        if (!confirmation) return;
        
        const discogsHandler = new DiscogsHandler(discogsKey, discogsSecret);
        const modal = document.getElementById('progress-modal');
        const modalTitle = document.getElementById('modal-title');
        const progressFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const progressBar = modal.querySelector('.progress-bar');
        const cancelBtn = document.getElementById('cancel-validation-button');
        const closeBtn = document.getElementById('close-modal-button');
        const mainValidateButton = document.getElementById('validate-years-button');

        this.validationCancelled = false;
        modalTitle.textContent = 'Évszámok validálása (Discogs)...';
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
            progressText.textContent = `(${i + 1}/${dataToValidate.length}) Feldolgozás: ${track.artist} - ${track.title}`;

            if (!track.artist || !track.title) {
                removedCount++;
                continue;
            };
            
            const foundYear = await discogsHandler.searchTrackYear(track.artist, track.title);
            const isValidOriginalYear = originalYear && /^\d{4}$/.test(String(originalYear).trim());

            if (foundYear) {
                if (String(foundYear) !== String(originalYear)) {
                    updatedCount++;
                }
                track.year = String(foundYear);
                validatedData.push(track);
            } else if (isValidOriginalYear) {
                validatedData.push(track);
            } else {
                removedCount++;
            }
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

    async handlePrint() {
        const modal = document.getElementById('print-progress-modal');
        const progressFill = document.getElementById('print-progress-bar-fill');
        const progressText = document.getElementById('print-progress-text');
        
        modal.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Kártyák generálása...';

        document.body.classList.add('grid-view-active');
        document.body.classList.add('is-printing'); 
        
        const printArea = document.getElementById('print-area');
        printArea.innerHTML = ''; 

        const progressCallback = (current, total) => {
            const percent = total > 0 ? (current / total) * 100 : 0;
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `Kártyák generálása: ${current} / ${total}`;
        };

        const isToken = document.getElementById('mode-token')?.checked;
        if (isToken || (this.data && this.data.length > 0)) {
            await renderAllPagesWithProgress(printArea, this.data, progressCallback);
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            
            const originalTitle = document.title;
            document.title = this.generatePrintFilename();

            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.body.classList.remove('is-printing');
                    document.title = originalTitle;
                    this.handleSettingsChange(true);
                }, 1000);
            }, 200);
        }, 500);
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
            updateRecordCount(0, false);
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