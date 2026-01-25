import sampleData from './sample-data.js';

export async function loadSampleData() {
    return sampleData;
}

/**
 * Checks if a row contains header-like strings.
 */
function isHeaderRow(row) {
    if (!row || row.length === 0) return false;
    const keywords = ['artist', 'előadó', 'title', 'cím', 'dal', 'track', 'year', 'év', 'release', 'qr', 'link', 'url', 'code'];
    return row.some(cell => {
        if (typeof cell !== 'string') return false;
        const lower = cell.toLowerCase().trim();
        return keywords.some(k => lower.includes(k));
    });
}

/**
 * Intelligently finds column indices based on header names.
 */
function findColumns(headerRow) {
    const mapping = {
        artist: ['artist', 'előadó'],
        title: ['title', 'cím', 'dal', 'track'],
        year: ['year', 'év', 'release'],
        qr_data: ['qr', 'qr_data', 'qr data', 'link', 'url'],
        code1: ['code1', 'kód1', 'code 1'],
        code2: ['code2', 'kód2', 'code 2']
    };

    let indices = { artist: -1, title: -1, year: -1, qr_data: -1, code1: -1, code2: -1 };
    
    headerRow.forEach((header, index) => {
        if (typeof header !== 'string') return;
        const lowerHeader = header.toLowerCase().trim();
        for (const key in mapping) {
            if (indices[key] === -1 && mapping[key].some(alias => lowerHeader.includes(alias))) {
                indices[key] = index;
            }
        }
    });

    // If some columns are not found, fallback to default order for missing ones
    if (indices.artist === -1) indices.artist = 0;
    if (indices.title === -1) indices.title = 1;
    if (indices.year === -1) indices.year = 2;
    if (indices.qr_data === -1) indices.qr_data = 3;
    if (indices.code1 === -1) indices.code1 = 4;
    if (indices.code2 === -1) indices.code2 = 5;
    
    return indices;
}

/**
 * Parses the content of a CSV file.
 */
function parseCSV(csvText) {
    // Basic CSV parsing: handles quotes and commas inside fields.
    const rows = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (rows.length === 0) return [];
    
    const data = rows.map(row => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });

    let headerRow = data[0];
    let dataRows = data;
    let columnIndices;
    
    if (isHeaderRow(headerRow)) {
        columnIndices = findColumns(headerRow);
        dataRows = data.slice(1);
    } else {
        // No header, use default order
        columnIndices = { artist: 0, title: 1, year: 2, qr_data: 3, code1: 4, code2: 5 };
    }

    return dataRows.filter(row => row.length > 0 && row.some(cell => cell)).map(row => ({
        artist: row[columnIndices.artist] || '',
        title: row[columnIndices.title] || '',
        year: row[columnIndices.year] || '',
        qr_data: row[columnIndices.qr_data] || '',
        code1: row[columnIndices.code1] || '',
        code2: row[columnIndices.code2] || ''
    }));
}


export function parseDataFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        reader.onload = (event) => {
            try {
                if (fileExtension === 'csv') {
                    const json = parseCSV(event.target.result);
                    resolve(json);
                } else { // Handle XLS, XLSX
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (rawData.length === 0) return resolve([]);

                    let headerRow = rawData[0];
                    let dataRows = rawData;
                    let columnIndices;

                    if (isHeaderRow(headerRow)) {
                        columnIndices = findColumns(headerRow);
                        dataRows = rawData.slice(1);
                    } else {
                        columnIndices = { artist: 0, title: 1, year: 2, qr_data: 3, code1: 4, code2: 5 };
                    }

                    const json = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell != null && cell !== ''))
                        .map(row => ({
                            artist: row[columnIndices.artist] || '',
                            title: row[columnIndices.title] || '',
                            year: row[columnIndices.year] || '',
                            qr_data: row[columnIndices.qr_data] || '',
                            code1: row[columnIndices.code1] || '',
                            code2: row[columnIndices.code2] || ''
                        }));
                    
                    resolve(json);
                }
            } catch (e) {
                console.error("File parsing error:", e);
                reject(new Error("Hiba a fájl feldolgozása közben."));
            }
        };

        reader.onerror = (error) => reject(error);

        if (fileExtension === 'csv') {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}