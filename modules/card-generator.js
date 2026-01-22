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
    
    // NEW SETTINGS
    const baseColor = document.getElementById('vinyl-color')?.value || '#000000';
    const isNeon = document.getElementById('vinyl-neon')?.checked;
    const neonBlur = document.getElementById('vinyl-neon-blur')?.value || 5;

    const gMin = parseInt(document.getElementById('glitch-min')?.value) || 1;
    const gMax = parseInt(document.getElementById('glitch-max')?.value) || 2;
    
    const gWidthMin = parseFloat(document.getElementById('glitch-width-min')?.value) || 25;
    const gWidthMax = parseFloat(document.getElementById('glitch-width-max')?.value) || 30;
    
    const variate = document.getElementById('vinyl-variate')?.checked;

    let svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">`;

    for (let i = 0; i < grooveCount; i++) {
        const r = 48 - (i * spacing);
        if (r < 5) break;

        const circ = 2 * Math.PI * r;
        const gCount = Math.floor(Math.random() * (gMax - gMin + 1)) + gMin;
        
        let dashArray = [];
        
        if (gCount === 0) {
            dashArray.push(circ, 0);
        } else {
            // ORGANIC GLITCH LOGIC: Random Angles
            let cuts = [];
            
            // Try to place glitches randomly
            for (let g = 0; g < gCount * 2; g++) { // Try more times than needed (dart throwing)
                if (cuts.length >= gCount) break;

                const angle = Math.random() * 360; // Start angle in degrees
                // Convert percentage width to degrees
                const widthPercent = Math.random() * (gWidthMax - gWidthMin) + gWidthMin; 
                const arcLength = (widthPercent / 100) * circ;
                const angleSpan = (arcLength / circ) * 360;

                // Check collision with existing cuts + random buffer
                const buffer = 15 + Math.random() * 45; // Minimum 15 deg buffer, up to 60 deg
                
                let overlap = false;
                for (let c of cuts) {
                    // Simple radial overlap check handling 0-360 wrap
                    let diff = Math.abs(c.angle - angle);
                    if (diff > 180) diff = 360 - diff;
                    
                    if (diff < (c.span/2 + angleSpan/2 + buffer)) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    cuts.push({ angle, span: angleSpan, arc: arcLength });
                }
            }

            // If no valid cuts found (unlikely but possible), full circle
            if (cuts.length === 0) {
                dashArray.push(circ, 0);
            } else {
                // Sort by angle to draw sequentially
                cuts.sort((a, b) => a.angle - b.angle);

                let currentPos = 0; // relative to 0 degrees (0 length)
                
                // Calculate dash array based on sorted cuts
                
                // Let's normalize angles to length positions on the circle (0 to circ)
                let cutSegments = cuts.map(c => {
                    let startPos = (c.angle / 360) * circ;
                    return { start: startPos, end: startPos + c.arc };
                });

                let lastP = 0;
                let dashAccumulator = [];
                
                cutSegments.forEach(cut => {
                     let drawLen = cut.start - lastP;
                     // If random angle generation caused overlap (shouldn't), clamp
                     if(drawLen < 0) drawLen = 0; 
                     
                     let gapLen = cut.end - cut.start;
                     
                     dashAccumulator.push(drawLen); // Draw line
                     dashAccumulator.push(gapLen);  // Gap (glitch)
                     
                     lastP = cut.end;
                });
                
                // Close the loop
                let finalDraw = circ - lastP;
                if(finalDraw > 0) {
                    // Combine final draw with first draw if array isn't empty
                    if(dashAccumulator.length > 0) {
                        dashAccumulator[0] += finalDraw;
                    } else {
                        dashAccumulator.push(finalDraw, 0);
                    }
                }
                
                dashArray = dashAccumulator;
            }
        }

        const sw = variate ? (baseThickness * (0.6 + Math.random() * 0.8)) : baseThickness;
        const op = (opacityPercent / 100) * (0.12 + (i * (0.8 / grooveCount))); 
        
        // Random rotation for the whole ring to break visual alignment further
        const rot = Math.random() * 360;

        // NEON LOGIC
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
            ${song.code1 ? `<div class="code1">${song.code1}</div>` : ''}
            ${song.code2 ? `<div class="code2">${song.code2}</div>` : ''}
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
        // TOKEN MODE GENERATION:
        // Generate 2 full pages. 
        // Page 1: All Front cards (with borders if enabled)
        // Page 2: All Back cards (FORCE NO BORDERS)
        
        const tokenConfig = {
            mainText: document.getElementById('token-main-text').value || "TOKEN",
            subText: document.getElementById('token-sub-text').value || ""
        };

        // --- PAGE 1: FRONT ---
        const page1 = document.createElement('div');
        page1.className = `page-container ${paper}`;
        page1.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, false); // isBack = false -> Front logic
             wrap.appendChild(card);
             page1.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        }
        container.appendChild(page1);

        // --- PAGE 2: BACK (NO BORDERS ENFORCED) ---
        const page2 = document.createElement('div');
        page2.className = `page-container ${paper}`;
        page2.style.gridTemplateColumns = `repeat(${cols}, ${cardSizeMm}mm)`;
        
        for(let i=0; i<perPage; i++) {
             const wrap = document.createElement('div');
             wrap.className = 'card-wrapper';
             const card = createTokenCard(tokenConfig, true); // isBack = true
             
             // FORCE NO BORDER FOR BACK TOKEN PAGE
             card.style.borderColor = 'transparent';
             
             wrap.appendChild(card);
             page2.appendChild(wrap);
             adjustText(card.querySelector('.token-main'));
             adjustText(card.querySelector('.token-sub'));
        }
        container.appendChild(page2);

    } else {
        // MUSIC MODE GENERATION (Existing Logic)
        let processData = data;
        if (!document.body.classList.contains('is-printing')) {
            processData = data.slice(0, perPage); 
        }

        for (let i = 0; i < processData.length; i += perPage) {
            const chunk = processData.slice(i, i + perPage);
            
            // FRONT
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

            // BACK
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