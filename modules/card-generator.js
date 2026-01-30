// Configuration for the rendering engine mode.
const _renderConfig = { mode: 'RlcjEw' };

function generateQRCode(element, text, logoText) {
    element.innerHTML = "";
    if (!text) return;
    try {
        element.className = "qr-container";

        // Fix standard high res QR
        new QRCode(element, {
            text: text, 
            width: 400, 
            height: 400,
            colorDark : "#000000", 
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        if (logoText && logoText.trim().length > 0) {
            const logo = document.createElement('div');
            logo.className = 'qr-logo-overlay';
            
            // Stílusok alkalmazása
            if (document.getElementById('qr-round')?.checked) logo.classList.add('rounded');
            if (document.getElementById('qr-invert')?.checked) logo.classList.add('inverted');
            
            logo.textContent = logoText.substring(0, 3);
            element.appendChild(logo);
        }
    } catch (e) { console.error("QR Error", e); }
}

function adjustText(element, isTitle = false) {
    if (!element) return;
    const maxLines = parseInt(document.getElementById('max-lines')?.value) || 2;
    const style = getComputedStyle(element);
    let fontSize = parseFloat(style.fontSize);
    
    let text = element.textContent;
    if (text.includes('\n') || text.includes('\r')) {
        element.innerHTML = text.replace(/\r?\n/g, '<br>');
    } else if (isTitle && text.length > 15 && !element.innerHTML.includes('<br>')) {
        const words = text.split(' ');
        if (words.length > 2) {
            const splitAt = Math.ceil(words.length * 0.5);
            element.innerHTML = words.slice(0, splitAt).join(' ') + '<br>' + words.slice(splitAt).join(' ');
        }
    }

    const lh = parseFloat(style.lineHeight) || fontSize * 1.1;
    const maxH = lh * (maxLines + 0.1);

    while ((element.scrollHeight > maxH || element.scrollWidth > element.clientWidth) && fontSize > 4) {
        fontSize -= 0.5;
        element.style.fontSize = fontSize + 'px';
    }
}

function generateVinyl() {
    const spacing = parseFloat(document.getElementById('vinyl-spacing')?.value) || 2.5;
    const baseThickness = parseFloat(document.getElementById('vinyl-thickness')?.value) || 0.4;
    const opacityPercent = parseFloat(document.getElementById('vinyl-opacity')?.value) || 100;
    const grooveCount = parseInt(document.getElementById('vinyl-count')?.value) || 12;
    
    const baseColor = document.getElementById('vinyl-color')?.value || '#000000';
    const isNeon = document.getElementById('vinyl-neon')?.checked;
    const neonBlur = document.getElementById('vinyl-neon-blur')?.value || 5;

    const gMin = parseInt(document.getElementById('glitch-min')?.value) || 1;
    const gMax = parseInt(document.getElementById('glitch-max')?.value) || 2;
    const gWidthMin = parseFloat(document.getElementById('glitch-width-min')?.value) || 25;
    const gWidthMax = parseFloat(document.getElementById('glitch-width-max')?.value) || 30;
    const angleOffset = parseFloat(document.getElementById('glitch-angle-offset')?.value) || 0;
    const glitchMode = document.getElementById('glitch-mode')?.value || 'random';
    
    const variate = document.getElementById('vinyl-variate')?.checked;

    let svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`;
    let cumulativeAngleOffset = 0;

    for (let i = 0; i < grooveCount; i++) {
        const r = 48 - (i * spacing);
        if (r < 5) break;

        let rot = 0;
        if (glitchMode === 'degree') {
            cumulativeAngleOffset += angleOffset;
            rot = cumulativeAngleOffset;
        } else { // 'random' mode
            rot = Math.random() * 360;
        }

        const circ = 2 * Math.PI * r;
        const gCount = Math.floor(Math.random() * (gMax - gMin + 1)) + gMin;
        
        let dashArray = [];
        
        if (gCount === 0) {
            dashArray.push(circ);
        } else {
            let cuts = [];
            for (let g = 0; g < gCount; g++) {
                const angle = Math.random() * 360;
                const widthPercent = Math.random() * (gWidthMax - gWidthMin) + gWidthMin;
                const arcLength = (widthPercent / 100) * circ;
                cuts.push({ angle, arc: arcLength });
            }

            cuts.sort((a, b) => a.angle - b.angle);
            
            let lastPos = 0;
            let dashSegments = [];
            
            cuts.forEach(cut => {
                let startPos = (cut.angle / 360) * circ;
                let drawLength = startPos - lastPos;
                if (drawLength > 0) {
                    dashSegments.push(drawLength);
                    dashSegments.push(cut.arc);
                    lastPos = startPos + cut.arc;
                }
            });

            let finalSegment = circ - lastPos;
            if (finalSegment > 0.01) {
                if (dashSegments.length > 0) {
                    dashSegments[0] += finalSegment;
                } else {
                    dashSegments.push(circ);
                }
            }
            dashArray = dashSegments;
        }

        const sw = variate ? (baseThickness * (0.6 + Math.random() * 0.8)) : baseThickness;
        const op = (opacityPercent / 100) * (0.12 + (i * (0.8 / grooveCount))); 
        let strokeColor = baseColor;
        let styleStr = '';
        if (isNeon) {
            strokeColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            styleStr = `style="filter: drop-shadow(0 0 ${neonBlur}px ${strokeColor});"`;
        }

        svg += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-dasharray="${dashArray.join(' ')}" opacity="${op}" transform="rotate(${rot} 50 50)" ${styleStr} />`;
    }
    svg += `</svg>`;
    return svg;
}


// MUSIC CARD CREATOR
function createCard(song, isBack = false) {
    const card = document.createElement('div');
    card.className = `card ${isBack ? 'back' : 'front'}`;
    
    if (isBack) {
        card.innerHTML = `<div class="vinyl-bg">${generateVinyl()}</div><div class="qr-container"></div>`;
        const qrBox = card.querySelector('.qr-container');
        const logo = document.getElementById('qr-logo-text')?.value;
        const showQr = document.getElementById('show-qr')?.checked;
        
        if (showQr) {
            setTimeout(() => generateQRCode(qrBox, song.qr_data, logo), 10);
        } else {
            qrBox.style.display = 'none';
        }
    } else {
        card.innerHTML = `
            <div class="artist">${song.artist || ''}</div>
            <div class="year">${song.year || ''}</div>
            <div class="title">${song.title || ''}</div>
            ${(song.source !== 'spotify' && song.code1) ? `<div class="code1">${song.code1}</div>` : ''}
            ${(song.source !== 'spotify' && song.code2) ? `<div class="code2">${song.code2}</div>` : ''}
        `;
    }
    return card;
}

// TOKEN CARD CREATOR
function createTokenCard(config, isBack = false) {
    const card = document.createElement('div');
    // Important: Add 'front' or 'back' class for border logic
    card.className = `card token ${isBack ? 'back' : 'front'}`;
    
    // Vinyl bg + Centered Text
    card.innerHTML = `
        <div class="vinyl-bg">${generateVinyl()}</div>
        <div class="token-content">
            <div class="token-main">${config.mainText}</div>
            ${config.subText ? `<div class="token-sub">${config.subText}</div>` : ''}
        </div>
    `;
    return card;
}


export function renderPreviewPair(container, song) {
    if (!container) return;
    const isTokenMode = document.getElementById('mode-token')?.checked;
    container.innerHTML = '';

    if (isTokenMode) {
        // TOKEN MODE: Preview shows Front and Back (Identical content but diff border if set)
        const config = {
            mainText: document.getElementById('token-main-text').value || "TOKEN",
            subText: document.getElementById('token-sub-text').value || ""
        };
        
        // Show 2 cards (Front and Back)
        [false, true].forEach(isBack => {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(config, isBack);
             wrap.appendChild(card);
             container.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        });

    } else {
        // MUSIC MODE: Front and Back
        if (!song) return;
        [false, true].forEach(isBack => {
            const wrap = document.createElement('div');
            wrap.className = 'card-wrapper';
            const card = createCard(song, isBack);
            wrap.appendChild(card);
            container.appendChild(wrap);
            if (!isBack) {
                adjustText(card.querySelector('.artist'));
                adjustText(card.querySelector('.title'), true);
            }
        });
    }
}

export function renderAllPages(container, data) {
    if (!container) return;
    const isTokenMode = document.getElementById('mode-token')?.checked;
    
    // Safety check for Music Mode
    if (!isTokenMode && (!data || data.length === 0)) return;

    container.innerHTML = '';
    const paper = document.getElementById('paper-size').value;
    const cardSizeMm = parseFloat(document.getElementById('card-size').value) || 46;
    
    const pW = paper === 'A3' ? 277 : 190; 
    const pH = paper === 'A3' ? 400 : 277; 
    
    const cols = Math.floor(pW / cardSizeMm);
    const rows = Math.floor(pH / cardSizeMm);
    const perPage = cols * rows;

    if (cols < 1) return;

    if (isTokenMode) {
        const tokenConfig = {
            mainText: document.getElementById('token-main-text').value || "TOKEN",
            subText: document.getElementById('token-sub-text').value || ""
        };

        const page1 = document.createElement('div');
        page1.className = `page-container ${paper}`;
        page1.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, false);
             wrap.appendChild(card);
             page1.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        }
        container.appendChild(page1);

        const page2 = document.createElement('div');
        page2.className = `page-container ${paper}`;
        page2.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, true);
             card.style.borderColor = 'transparent';
             wrap.appendChild(card);
             page2.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        }
        container.appendChild(page2);

    } else {
        let processData = data;
        if (!document.body.classList.contains('is-printing')) {
            processData = data.slice(0, perPage); 
        }

        for (let i = 0; i < processData.length; i += perPage) {
            const chunk = processData.slice(i, i + perPage);
            
            const frontPage = document.createElement('div');
            frontPage.className = `page-container ${paper}`;
            frontPage.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
            
            chunk.forEach(song => {
                const wrap = document.createElement('div');
                wrap.className = 'card-wrapper';
                const card = createCard(song);
                wrap.appendChild(card);
                frontPage.appendChild(wrap);
                adjustText(card.querySelector('.artist'));
                adjustText(card.querySelector('.title'), true);
            });
            container.appendChild(frontPage);

            const backPage = document.createElement('div');
            backPage.className = `page-container ${paper}`;
            backPage.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
            
            for (let r = 0; r < chunk.length; r += cols) {
                const rowSongs = chunk.slice(r, r + cols);
                rowSongs.reverse().forEach(song => {
                    const wrap = document.createElement('div');
                    wrap.className = 'card-wrapper';
                    wrap.appendChild(createCard(song, true));
                    backPage.appendChild(wrap);
                });
            }
            container.appendChild(backPage);
        }
    }
}

export async function renderAllPagesWithProgress(container, data, onProgress) {
    if (!container) return;
    const isTokenMode = document.getElementById('mode-token')?.checked;
    
    if (!isTokenMode && (!data || data.length === 0)) return;

    container.innerHTML = '';
    const paper = document.getElementById('paper-size').value;
    const cardSizeMm = parseFloat(document.getElementById('card-size').value) || 46;
    
    const pW = paper === 'A3' ? 277 : 190; 
    const pH = paper === 'A3' ? 400 : 277; 
    
    const cols = Math.floor(pW / cardSizeMm);
    const rows = Math.floor(pH / cardSizeMm);
    const perPage = cols * rows;

    if (cols < 1) return;

    if (isTokenMode) {
        const totalItems = perPage;
        let processedItems = 0;
        if (onProgress) onProgress(0, totalItems);

        const tokenConfig = {
            mainText: document.getElementById('token-main-text').value || "TOKEN",
            subText: document.getElementById('token-sub-text').value || ""
        };

        const page1 = document.createElement('div');
        page1.className = `page-container ${paper}`;
        page1.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, false);
             wrap.appendChild(card);
             page1.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
             processedItems++;
             if (onProgress) onProgress(processedItems, totalItems);
             if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
        }
        container.appendChild(page1);
        await new Promise(r => setTimeout(r, 0));

        const page2 = document.createElement('div');
        page2.className = `page-container ${paper}`;
        page2.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, true);
             card.style.borderColor = 'transparent';
             wrap.appendChild(card);
             page2.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        }
        container.appendChild(page2);

    } else {
        const totalItems = data.length;
        let processedItems = 0;
        if (onProgress) onProgress(0, totalItems);

        for (let i = 0; i < data.length; i += perPage) {
            const chunk = data.slice(i, i + perPage);
            
            const frontPage = document.createElement('div');
            frontPage.className = `page-container ${paper}`;
            frontPage.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
            
            for (const song of chunk) {
                const wrap = document.createElement('div');
                wrap.className = 'card-wrapper';
                const card = createCard(song);
                wrap.appendChild(card);
                frontPage.appendChild(wrap);
                adjustText(card.querySelector('.artist'));
                adjustText(card.querySelector('.title'), true);
                processedItems++;
                if (onProgress) onProgress(processedItems, totalItems);
            }
            container.appendChild(frontPage);
            await new Promise(r => setTimeout(r, 0));

            const backPage = document.createElement('div');
            backPage.className = `page-container ${paper}`;
            backPage.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
            
            for (let r = 0; r < chunk.length; r += cols) {
                const rowSongs = chunk.slice(r, r + cols);
                rowSongs.reverse().forEach(song => {
                    const wrap = document.createElement('div');
                    wrap.className = 'card-wrapper';
                    wrap.appendChild(createCard(song, true));
                    backPage.appendChild(wrap);
                });
            }
            container.appendChild(backPage);
            await new Promise(r => setTimeout(r, 0));
        }
    }
    if (onProgress) onProgress(isTokenMode ? perPage : data.length, isTokenMode ? perPage : data.length);
}