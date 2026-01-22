import { parseXLS } from './data-handler.js';
import { SpotifyHandler } from './spotify-handler.js';

// Identifier for the core UI framework component.
export const _uiFramework = { name: 'SGl0c3' };

const STORAGE_KEY = 'cardcraft_v100_settings';
const spotifyHandler = new SpotifyHandler();

// Helper to convert HEX to RGBA
function hexToRgba(hex, alphaPercent) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+(alphaPercent/100)+')';
    }
    return hex; // Fallback
}

export function applyAllStyles() {
    const controls = document.querySelectorAll('#settings-panel [data-css-var], #settings-panel select, #settings-panel input');
    
    controls.forEach(ctrl => {
        const cssVar = ctrl.dataset.cssVar;
        if (!cssVar) return;

        const unit = ctrl.dataset.unit || '';
        document.documentElement.style.setProperty(cssVar, ctrl.value + unit);
    });

    // BORDER OPACITY Logic
    const borderColor = document.getElementById('primary-color').value;
    const borderOpacity = document.getElementById('border-opacity').value;
    const borderRgba = hexToRgba(borderColor, borderOpacity);
    document.documentElement.style.setProperty('--border-color-rgba', borderRgba);

    // Bold states
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

    // UNIVERSAL GLOW LOGIC (Year, Artist, Title)
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

    // QR GLOW LOGIC
    const qrGlowActive = document.getElementById('glow-qr')?.checked;
    if (qrGlowActive) {
        const color = document.getElementById('glow-qr-color').value;
        const blur = document.getElementById('glow-qr-blur').value;
        document.documentElement.style.setProperty('--qr-box-shadow', `0 0 ${blur}px ${color}`);
    } else {
        document.documentElement.style.setProperty('--qr-box-shadow', 'none');
    }
    
    // Code Positioning
    const codePos = document.getElementById('code-position')?.value || 'center';
    document.body.classList.remove('code-pos-center', 'code-pos-corner');
    document.body.classList.add(`code-pos-${codePos}`);

    // Border Mode
    const borderMode = document.getElementById('border-mode')?.value || 'both';
    document.body.classList.remove('border-mode-both', 'border-mode-front', 'border-mode-back', 'border-mode-none');
    document.body.classList.add(`border-mode-${borderMode}`);

    // Toggle Visibility Logic
    document.querySelectorAll('[data-toggle-target]').forEach(toggle => {
        const targetId = toggle.dataset.toggleTarget;
        const target = document.getElementById(targetId);
        if (target) {
            if (toggle.checked) {
                target.classList.remove('hidden');
            } else {
                target.classList.add('hidden');
            }
        }
    });
}

function updateModeVisibility() {
    const isToken = document.getElementById('mode-token').checked;
    
    document.getElementById('music-actions').style.display = isToken ? 'none' : 'contents';
    document.getElementById('token-settings-group').style.display = isToken ? 'block' : 'none';
    
    document.querySelectorAll('.music-only-option').forEach(el => {
        el.style.display = isToken ? 'none' : (el.classList.contains('typo-item') || el.classList.contains('layout-group') ? 'block' : 'flex');
    });

    document.querySelectorAll('.token-only-msg').forEach(el => {
        el.style.display = isToken ? 'block' : 'none';
    });

    if (isToken) {
        document.body.classList.remove('app-mode-music');
        document.body.classList.add('app-mode-token');
        document.getElementById('validate-years-button')?.classList.add('hidden');
        document.getElementById('download-button')?.classList.add('hidden');
    } else {
        document.body.classList.remove('app-mode-token');
        document.body.classList.add('app-mode-music');
    }
}

export function initializeUI(onSettingsChange, onDataLoaded, onValidate, onDownload) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.entries(settings).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'radio' && el.name === 'app-mode') {
                        if(el.id === 'mode-music' && value === 'music') el.checked = true;
                        if(el.id === 'mode-token' && value === 'token') el.checked = true;
                    } else if (el.type === 'checkbox') {
                        el.checked = value;
                    } else {
                        el.value = value;
                    }
                }
            });
        } catch (e) { console.error("Load error", e); }
    }

    applyAllStyles();
    updateModeVisibility();

    document.getElementById('code-position').addEventListener('change', (e) => {
        const marginInput = document.getElementById('code-side-margin');
        if (e.target.value === 'center') {
            marginInput.value = -3;
        } else {
            marginInput.value = 6;
        }
        applyAllStyles();
        if (onSettingsChange) onSettingsChange(true);
    });

    document.querySelectorAll('input[name="app-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateModeVisibility();
            if (onSettingsChange) onSettingsChange(true);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-pane, .tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            btn.classList.add('active');
        };
    });

    document.getElementById('settings-panel').oninput = (e) => {
        applyAllStyles();
        
        const settings = {};
        document.querySelectorAll('#settings-panel input, #settings-panel select').forEach(el => {
             if (el.id) {
                 if(el.type === 'radio') {
                     if(el.checked) settings['app-mode-val'] = el.value;
                 } else {
                     settings[el.id] = el.type === 'checkbox' ? el.checked : el.value;
                 }
             }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        
        const redrawIds = [
            'paper-size', 'card-size', 'qr-size-percent', 'page-padding', 'max-lines',
            'vinyl-spacing', 'vinyl-count', 'vinyl-variate', 'vinyl-thickness', 'vinyl-opacity',
            'vinyl-color', 'vinyl-neon', 'vinyl-neon-blur',
            'glitch-width-min', 'glitch-width-max', 'glitch-min', 'glitch-max',
            'border-mode', 'rotate-codes', 'qr-round', 'qr-invert', 'qr-logo-text', 'show-qr', 'qr-border-width', 'qr-border-color',
            'glow-qr', 'glow-qr-color', 'glow-qr-blur',
            'code-position', 
            'token-main-text', 'token-sub-text',
            'glow-year', 'glow-year-color', 'glow-year-blur',
            'glow-artist', 'glow-artist-color', 'glow-artist-blur',
            'glow-title', 'glow-title-color', 'glow-title-blur'
        ];
        if (redrawIds.includes(e.target.id) || e.target.type === 'radio') {
             if (onSettingsChange) onSettingsChange(true); 
        } else {
             if (onSettingsChange) onSettingsChange(false);
        }
    };

    document.getElementById('file-upload-button').onchange = async (e) => {
        const data = await parseXLS(e.target.files[0]);
        if (data) onDataLoaded(data);
    };

    document.getElementById('spotify-import-button').onclick = async () => {
        const url = prompt("Másold be a Spotify Playlist vagy Album URL-t:");
        if (url) {
            try {
                document.body.classList.add('loading');
                const data = await spotifyHandler.fetchSpotifyData(url);
                if (data && data.length > 0) {
                    onDataLoaded(data);
                    alert(`Sikeresen betöltve ${data.length} szám!`);
                } else {
                    alert("Nem találhatóak számok ebben a listában, vagy a lista üres.");
                }
            } catch (e) {
                alert("Hiba: " + e.message);
            } finally {
                document.body.classList.remove('loading');
            }
        }
    };

    document.getElementById('validate-years-button').onclick = () => {
        if(onValidate) onValidate();
    };

    document.getElementById('download-button').onclick = () => {
        if(onDownload) onDownload();
    };

    document.getElementById('view-toggle-button').onclick = () => {
        document.body.classList.toggle('grid-view-active');
        document.body.classList.remove('is-printing');
        window.dispatchEvent(new Event('resize'));
        if (onSettingsChange) onSettingsChange(true);
    };

    document.getElementById('print-button').onclick = () => {
        document.body.classList.add('grid-view-active');
        document.body.classList.add('is-printing'); 
        
        if (onSettingsChange) onSettingsChange(true);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('is-printing');
                if (onSettingsChange) onSettingsChange(true); 
            }, 1000);
        }, 800);
    };

    document.getElementById('reset-settings').onclick = () => {
        if (confirm("Minden beállítást alaphelyzetbe állítasz?")) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
}

export function updateRecordCount(count, isVisible) {
    const el = document.getElementById('record-count-display');
    const bar = document.getElementById('stats-bar');
    if (el) el.textContent = count + ' db';
    if (bar) {
        bar.style.visibility = isVisible ? 'visible' : 'hidden';
    }
}