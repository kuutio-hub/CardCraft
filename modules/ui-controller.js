import { parseDataFile } from './data-handler.js';

const _uiFramework = { name: 'SGl0c3' };

const STORAGE_KEY = 'cardcraft_v100_settings';
const API_STORAGE = {
    SPOTIFY_ID: 'cardcraft_spotify_id',
    SPOTIFY_SECRET: 'cardcraft_spotify_secret',
    DISCOGS_KEY: 'cardcraft_discogs_key',
    DISCOGS_SECRET: 'cardcraft_discogs_secret'
};
let saveIndicatorTimeout;

function hexToRgba(hex, alphaPercent) {
    let c;
    if(/^#([A-Fa-f09]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){ c= [c[0], c[0], c[1], c[1], c[2], c[2]]; }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+(alphaPercent/100)+')';
    }
    return hex;
}

export function applyAllStyles() {
    const controls = document.querySelectorAll('#settings-panel [data-css-var], #settings-panel select, #settings-panel input');
    
    controls.forEach(ctrl => {
        const cssVar = ctrl.dataset.cssVar;
        if (!cssVar) return;
        const unit = ctrl.dataset.unit || '';
        document.documentElement.style.setProperty(cssVar, ctrl.value + unit);
    });

    const borderColor = document.getElementById('primary-color').value;
    const borderOpacity = document.getElementById('border-opacity').value;
    document.documentElement.style.setProperty('--border-color-rgba', hexToRgba(borderColor, borderOpacity));

    const boldConfigs = [
        { id: 'bold-year', var: '--font-weight-year', weightId: 'weight-year' },
        { id: 'bold-artist', var: '--font-weight-artist', weightId: 'weight-artist' },
        { id: 'bold-title', var: '--font-weight-title', weightId: 'weight-title' },
        { id: 'bold-codes', var: '--font-weight-codes' }
    ];

    boldConfigs.forEach(conf => {
        const chk = document.getElementById(conf.id);
        const weightInput = conf.weightId ? document.getElementById(conf.weightId) : null;
        const val = chk && chk.checked ? (weightInput ? weightInput.value : '700') : '400';
        document.documentElement.style.setProperty(conf.var, val);
    });

    ['year', 'artist', 'title'].forEach(type => {
        const glowActive = document.getElementById(`glow-${type}`)?.checked;
        if (glowActive) {
            const color = document.getElementById(`glow-${type}-color`).value;
            const blur = document.getElementById(`glow-${type}-blur`).value;
            document.documentElement.style.setProperty(`--text-shadow-${type}`, `0 0 ${blur}px ${color}`);
        } else {
            document.documentElement.style.setProperty(`--text-shadow-${type}`, 'none');
        }
    });

    const qrGlowActive = document.getElementById('glow-qr')?.checked;
    if (qrGlowActive) {
        const color = document.getElementById('glow-qr-color').value;
        const blur = document.getElementById('glow-qr-blur').value;
        document.documentElement.style.setProperty('--qr-box-shadow', `0 0 ${blur}px ${color}`);
    } else {
        document.documentElement.style.setProperty('--qr-box-shadow', 'none');
    }
    
    const codePos = document.getElementById('code-position')?.value || 'center';
    document.body.classList.remove('code-pos-center', 'code-pos-corner');
    document.body.classList.add(`code-pos-${codePos}`);

    const borderMode = document.getElementById('border-mode')?.value || 'both';
    document.body.classList.remove('border-mode-both', 'border-mode-front', 'border-mode-back', 'border-mode-none');
    document.body.classList.add(`border-mode-${borderMode}`);

    document.querySelectorAll('[data-toggle-target]').forEach(toggle => {
        const target = document.getElementById(toggle.dataset.toggleTarget);
        if (target) target.classList.toggle('hidden', !toggle.checked);
    });
}

function updateModeVisibility(isExternalDataLoaded) {
    const isToken = document.getElementById('mode-token').checked;
    
    document.getElementById('music-actions').style.display = isToken ? 'none' : 'flex';
    document.getElementById('token-settings-group').style.display = isToken ? 'block' : 'none';
    
    document.querySelectorAll('.music-only-option').forEach(el => {
        el.style.display = isToken ? 'none' : 'block';
    });

    document.querySelectorAll('.token-only-msg').forEach(el => {
        el.style.display = isToken ? 'block' : 'none';
    });

    document.body.classList.toggle('app-mode-token', isToken);
    document.body.classList.toggle('app-mode-music', !isToken);

    if (!isToken && isExternalDataLoaded()) {
        document.getElementById('validate-years-button')?.classList.remove('hidden');
        document.getElementById('download-button')?.classList.remove('hidden');
    } else {
        document.getElementById('validate-years-button')?.classList.add('hidden');
        document.getElementById('download-button')?.classList.add('hidden');
    }
}

function updateApiStatus() {
    const spotifyId = localStorage.getItem(API_STORAGE.SPOTIFY_ID);
    const spotifySecret = localStorage.getItem(API_STORAGE.SPOTIFY_SECRET);
    const discogsKey = localStorage.getItem(API_STORAGE.DISCOGS_KEY);
    const discogsSecret = localStorage.getItem(API_STORAGE.DISCOGS_SECRET);

    const statusEl = document.getElementById('api-status');
    const spotifyBtn = document.getElementById('spotify-import-button');
    const validateBtn = document.getElementById('validate-years-button');
    const exportArea = document.getElementById('export-keys-area');
    
    const spotifyOk = spotifyId && spotifySecret;
    const discogsOk = discogsKey && discogsSecret;

    spotifyBtn.disabled = !spotifyOk;
    spotifyBtn.title = spotifyOk ? 'Spotify Lista Betöltése' : 'Spotify kulcsok nincsenek beállítva!';
    
    validateBtn.disabled = !discogsOk;
    validateBtn.title = discogsOk ? 'Évszámok ellenőrzése (Discogs)' : 'Discogs kulcsok nincsenek beállítva!';

    if (spotifyOk) {
        document.getElementById('spotify-client-id').value = spotifyId;
        document.getElementById('spotify-client-secret').value = spotifySecret;
    }
     if (discogsOk) {
        document.getElementById('discogs-key').value = discogsKey;
        document.getElementById('discogs-secret').value = discogsSecret;
    }

    let statusMessages = [];
    if (spotifyOk) statusMessages.push('Spotify OK');
    if (discogsOk) statusMessages.push('Discogs OK');

    if (statusMessages.length === 2) {
        statusEl.textContent = 'Státusz: Minden API kulcs mentve.';
        statusEl.className = 'api-status-ok';
    } else if (statusMessages.length > 0) {
        statusEl.textContent = `Státusz: ${statusMessages.join(', ')}.`;
        statusEl.className = 'api-status-ok';
    } else {
        statusEl.textContent = 'Státusz: Nincsenek kulcsok beállítva.';
        statusEl.className = 'api-status-error';
    }
    
    const exportableKeys = {
        sId: spotifyId,
        sSec: spotifySecret,
        dKey: discogsKey,
        dSec: discogsSecret
    };
    
    if (Object.values(exportableKeys).some(v => v)) {
        try {
            exportArea.value = btoa(JSON.stringify(exportableKeys));
        } catch (e) {
            exportArea.value = 'Hiba a kód generálása közben.';
        }
    } else {
         exportArea.value = '';
    }
}


export function initializeUI(onSettingsChange, onDataLoaded, onValidate, onDownload, isDataLoadedCheck, onSpotifyImport, onYouTubeImport, onPrint) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.entries(settings).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'radio' && el.name === 'app-mode') {
                        if (settings['app-mode-val'] === el.value) {
                           el.checked = true;
                        }
                    } else if (el.type === 'checkbox' || el.type === 'radio') {
                        el.checked = value;
                    } else {
                        el.value = value;
                    }
                }
            });
        } catch (e) { console.error("Load error", e); }
    }

    applyAllStyles();
    updateModeVisibility(isDataLoadedCheck);
    updateApiStatus();
    
    const initialGlitchMode = document.getElementById('glitch-mode').value;
    document.getElementById('glitch-angle-offset-row').classList.toggle('hidden', initialGlitchMode !== 'degree');


    document.getElementById('code-position').addEventListener('change', (e) => {
        document.getElementById('code-side-margin').value = e.target.value === 'center' ? 0 : 6;
        applyAllStyles();
        if (onSettingsChange) onSettingsChange(true);
    });

    document.querySelectorAll('input[name="app-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateModeVisibility(isDataLoadedCheck);
            if (onSettingsChange) onSettingsChange(true);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
             if (e.currentTarget.id === 'help-button') return;
             document.querySelectorAll('.tab-pane, .tab-btn').forEach(el => el.classList.remove('active'));
             document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
             btn.classList.add('active');
        };
    });
    
    document.getElementById('help-button').onclick = async () => {
        const modal = document.getElementById('help-modal');
        const contentContainer = document.getElementById('help-content-container');
        
        if (contentContainer.innerHTML.trim() === '') {
            try {
                const response = await fetch('user_manual.html');
                if (!response.ok) throw new Error('Network response was not ok');
                const html = await response.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const accordionWrapper = document.createElement('div');
                accordionWrapper.className = 'help-accordion';

                doc.querySelectorAll('h2').forEach(h2 => {
                    const item = document.createElement('div');
                    item.className = 'help-item';

                    const q = document.createElement('div');
                    q.className = 'help-q';
                    q.textContent = h2.textContent;
                    
                    const a = document.createElement('div');
                    a.className = 'help-a';
                    
                    let nextElem = h2.nextElementSibling;
                    while(nextElem && nextElem.tagName !== 'H2') {
                        a.appendChild(nextElem.cloneNode(true));
                        nextElem = nextElem.nextElementSibling;
                    }
                    
                    item.appendChild(q);
                    item.appendChild(a);
                    accordionWrapper.appendChild(item);
                });

                contentContainer.appendChild(accordionWrapper);

                accordionWrapper.addEventListener('click', (e) => {
                    const question = e.target.closest('.help-q');
                    if (question) {
                        const item = question.parentElement;
                        const wasActive = item.classList.contains('active');

                        accordionWrapper.querySelectorAll('.help-item').forEach(i => i.classList.remove('active'));
                        
                        if (!wasActive) {
                            item.classList.add('active');
                        }
                    }
                });

            } catch (e) {
                contentContainer.innerHTML = '<p>Hiba a súgó betöltése közben.</p>';
                console.error("Help load error", e);
            }
        }
        modal.classList.remove('hidden');
    };

    const helpModal = document.getElementById('help-modal');
    document.getElementById('close-help-modal-button').onclick = () => helpModal.classList.add('hidden');
    helpModal.onclick = (e) => {
        if (e.target.id === 'help-modal') {
            helpModal.classList.add('hidden');
        }
    };

    document.getElementById('glitch-angle-offset').addEventListener('input', (e) => {
        document.getElementById('glitch-angle-value').textContent = `${e.target.value}°`;
    });


    document.getElementById('settings-panel').oninput = (e) => {
        if(e.target.id.includes('spotify-') || e.target.id.includes('discogs-') || e.target.id.includes('-keys-area')) {
            return;
        }

        applyAllStyles();
        
        if (e.target.id === 'glitch-mode') {
            document.getElementById('glitch-angle-offset-row').classList.toggle('hidden', e.target.value !== 'degree');
        }

        const settings = {};
        document.querySelectorAll('#settings-panel input, #settings-panel select').forEach(el => {
             if (el.id && !el.id.startsWith('spotify-') && !el.id.startsWith('discogs-') && !el.id.includes('-keys-')) {
                 if (el.name === 'app-mode') {
                     if(el.checked) settings['app-mode-val'] = el.value;
                 } else {
                     settings[el.id] = el.type === 'checkbox' ? el.checked : el.value;
                 }
             }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        const indicator = document.getElementById('save-indicator');
        indicator.classList.remove('hidden');
        if (saveIndicatorTimeout) clearTimeout(saveIndicatorTimeout);
        saveIndicatorTimeout = setTimeout(() => indicator.classList.add('hidden'), 2000);
        
        const redrawIds = [
            'paper-size', 'card-size', 'qr-size-percent', 'page-padding', 'max-lines',
            'vinyl-spacing', 'vinyl-count', 'vinyl-variate', 'vinyl-thickness', 'vinyl-opacity',
            'vinyl-color', 'vinyl-neon', 'vinyl-neon-blur', 'glitch-width-min', 'glitch-width-max', 'glitch-min', 'glitch-max',
            'glitch-angle-offset', 'glitch-mode',
            'border-mode', 'rotate-codes', 'qr-round', 'qr-invert', 'qr-logo-text', 'show-qr', 'qr-border-width', 'qr-border-color',
            'glow-qr', 'glow-qr-color', 'glow-qr-blur', 'code-position', 'token-main-text', 'token-sub-text',
            'glow-year', 'glow-year-color', 'glow-year-blur', 'glow-artist', 'glow-artist-color', 'glow-artist-blur',
            'glow-title', 'glow-title-color', 'glow-title-blur'
        ];
        if (redrawIds.includes(e.target.id) || e.target.name === 'app-mode') {
             if (onSettingsChange) onSettingsChange(true); 
        } else {
             if (onSettingsChange) onSettingsChange(false);
        }
    };
    
    document.getElementById('save-api-keys').onclick = () => {
        const sId = document.getElementById('spotify-client-id').value.trim();
        const sSec = document.getElementById('spotify-client-secret').value.trim();
        const dKey = document.getElementById('discogs-key').value.trim();
        const dSec = document.getElementById('discogs-secret').value.trim();

        if (sId && sSec) {
            localStorage.setItem(API_STORAGE.SPOTIFY_ID, sId);
            localStorage.setItem(API_STORAGE.SPOTIFY_SECRET, sSec);
        } else {
            localStorage.removeItem(API_STORAGE.SPOTIFY_ID);
            localStorage.removeItem(API_STORAGE.SPOTIFY_SECRET);
        }
        
        if (dKey && dSec) {
            localStorage.setItem(API_STORAGE.DISCOGS_KEY, dKey);
            localStorage.setItem(API_STORAGE.DISCOGS_SECRET, dSec);
        } else {
            localStorage.removeItem(API_STORAGE.DISCOGS_KEY);
            localStorage.removeItem(API_STORAGE.DISCOGS_SECRET);
        }

        updateApiStatus();
        alert('API kulcsok sikeresen mentve!');
    };
    
    document.getElementById('copy-export-key').onclick = () => {
        const exportArea = document.getElementById('export-keys-area');
        if (exportArea.value) {
            navigator.clipboard.writeText(exportArea.value)
                .then(() => alert('Export kód a vágólapra másolva!'))
                .catch(err => alert('Hiba a másolás során.'));
        }
    };
    
    document.getElementById('import-key-button').onclick = () => {
        const importArea = document.getElementById('import-keys-area');
        const importKey = importArea.value.trim();
        if (!importKey) return alert('Kérlek, illeszd be az import kódot.');

        try {
            const decoded = atob(importKey);
            const keys = JSON.parse(decoded);

            if (keys.sId && keys.sSec) {
                localStorage.setItem(API_STORAGE.SPOTIFY_ID, keys.sId);
                localStorage.setItem(API_STORAGE.SPOTIFY_SECRET, keys.sSec);
            }
            if (keys.dKey && keys.dSec) {
                localStorage.setItem(API_STORAGE.DISCOGS_KEY, keys.dKey);
                localStorage.setItem(API_STORAGE.DISCOGS_SECRET, keys.dSec);
            }
            updateApiStatus();
            importArea.value = '';
            alert('Kulcsok sikeresen importálva és mentve!');
        } catch (e) {
            alert('Hiba: Érvénytelen import kód.');
        }
    };
    
    document.querySelectorAll('.toggle-password').forEach(el => {
        el.addEventListener('click', (e) => {
            const icon = e.currentTarget.querySelector('i');
            const input = e.currentTarget.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    document.getElementById('file-upload-button').onchange = async (e) => {
        const file = e.target.files[0];
        try {
            const data = await parseDataFile(file);
            if (data) onDataLoaded(data, file.name);
        } catch(err) {
            alert(err.message);
        }
        e.target.value = '';
    };

    document.getElementById('spotify-import-button').onclick = async () => {
        const url = prompt("Másold be a Spotify Playlist vagy Album URL-t:");
        if (url && onSpotifyImport) {
            onSpotifyImport(url);
        }
    };
    
    document.getElementById('youtube-import-button').onclick = async () => {
        const url = prompt("Másold be a YouTube Playlist URL-t:");
        if (url && onYouTubeImport) {
            onYouTubeImport(url);
        }
    };

    document.getElementById('validate-years-button').onclick = () => { if(onValidate) onValidate(); };
    document.getElementById('download-button').onclick = () => { if(onDownload) onDownload(); };
    document.getElementById('print-button').onclick = () => { if(onPrint) onPrint(); };

    document.getElementById('view-toggle-button').onclick = () => {
        document.body.classList.toggle('grid-view-active');
        document.body.classList.remove('is-printing');
        window.dispatchEvent(new Event('resize'));
        if (onSettingsChange) onSettingsChange(true);
    };

    document.getElementById('reset-settings').onclick = () => {
        if (confirm("Minden beállítást alaphelyzetbe állítasz? Ez a művelet a megadott API kulcsokat NEM törli.")) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
}

export function updateRecordCount(count, isVisible) {
    const el = document.getElementById('record-count-display');
    const bar = document.getElementById('stats-bar');
    if (el) el.textContent = count + ' db';
    if (bar) bar.style.visibility = isVisible ? 'visible' : 'hidden';
}