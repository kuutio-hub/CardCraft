import sampleData from './sample-data.js';

export async function loadSampleData() {
    return sampleData;
}

/**
 * Ellenőrzi, hogy a sor fejléceket tartalmaz-e.
 */
function isHeaderRow(row) {
    if (!row || row.length === 0) return false;
    const keywords = ['artist', 'előadó', 'title', 'cím', 'dal', 'year', 'év', 'url', 'link', 'qr'];
    return row.some(cell => {
        if (typeof cell !== 'string') return false;
        const lower = cell.toLowerCase();
        return keywords.some(k => lower.includes(k));
    });
}

export function parseXLS(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (rawData.length === 0) return resolve([]);

                // Okos fejléc kezelés
                let startIdx = 0;
                if (isHeaderRow(rawData[0])) {
                    startIdx = 1;
                }

                const rows = rawData.slice(startIdx);
                
                const json = rows.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')).map(row => {
                    return {
                        artist: row[0],
                        title: row[1],
                        year: row[2],
                        qr_data: row[3],
                        code1: row[4],
                        code2: row[5]
                    };
                });
                
                resolve(json);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}