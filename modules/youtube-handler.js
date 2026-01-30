// modules/youtube-handler.js

function getPlaylistId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2]) ? match[2] : null;
}

function parseTitle(fullTitle) {
    if (!fullTitle) return { artist: 'Ismeretlen', title: 'Ismeretlen' };

    let cleanTitle = fullTitle.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();

    const separators = [' - ', ' – ', ' — ', ': '];
    for (const sep of separators) {
        const parts = cleanTitle.split(sep);
        if (parts.length > 1) {
            const artist = parts[0].trim();
            const title = parts.slice(1).join(sep).trim();
            if (artist.length < 35) { // Avoid cases where a long sentence is misinterpreted as the artist
                 return { artist, title };
            }
        }
    }
    
    return { artist: '', title: cleanTitle };
}

export class YoutubeHandler {
    constructor() {
        // No API key needed.
    }

    async fetchYouTubeData(url) {
        const playlistId = getPlaylistId(url);

        if (!playlistId) {
            throw new Error('Érvénytelen YouTube Playlist URL. A linknek tartalmaznia kell egy "list=..." paramétert.');
        }

        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        
        let playlistName = 'YouTube_Lista';

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Nem sikerült lekérni a lejátszási lista adatait. A lista lehet privát, nem létező, vagy a proxy szolgáltatás nem elérhető. (Státusz: ${response.status})`);
            }
            const xmlText = await response.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            
            const errorNode = xmlDoc.querySelector("parsererror");
            if (errorNode) {
                console.error("XML Parsing Error:", errorNode.textContent);
                throw new Error("Hiba a YouTube-tól kapott adat (XML) feldolgozása közben.");
            }
            
            const playlistTitleNode = xmlDoc.querySelector("feed > title");
            if (playlistTitleNode) {
                playlistName = playlistTitleNode.textContent;
            }

            const entries = xmlDoc.querySelectorAll("entry");
            if (entries.length === 0) {
                 return { tracks: [], name: playlistName };
            }

            const allTracks = Array.from(entries).map(entry => {
                const videoIdNode = entry.querySelector("videoId");
                const titleNode = entry.querySelector("title");
                const authorNode = entry.querySelector("author > name");

                if (!videoIdNode || !titleNode) return null;
                
                const videoId = videoIdNode.textContent;
                const fullTitle = titleNode.textContent;
                
                let { artist, title } = parseTitle(fullTitle);
                
                if (!artist && authorNode) {
                    artist = authorNode.textContent;
                } else if (!artist) {
                    artist = 'Ismeretlen';
                }

                const qr = `https://www.youtube.com/watch?v=${videoId}`;

                return { artist, title, year: '????', qr_data: qr, source: 'youtube' };
            }).filter(Boolean);

            return { tracks: allTracks, name: playlistName };

        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}