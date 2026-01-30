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
            if (artist.length < 45) return { artist, title };
        }
    }
    return { artist: '', title: cleanTitle };
}

export class YoutubeHandler {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
    }

    extractTracksFromItems(items) {
        if (!items) return [];
        return items.map(item => {
            const video = item.playlistPanelVideoRenderer || item.playlistVideoRenderer;
            if (!video || !video.videoId) return null;
            
            const fullTitle = video.title.runs?.[0]?.text || video.title.simpleText || 'Ismeretlen';
            let { artist, title } = parseTitle(fullTitle);

            if (!artist) {
                artist = video.longBylineText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || 'Ismeretlen';
            }
            const qr = `https://www.youtube.com/watch?v=${video.videoId}`;
            return { artist, title, year: '????', qr_data: qr, source: 'youtube' };
        }).filter(Boolean);
    }

    async fetchYouTubeData(url, progressCallback = () => {}) {
        const playlistId = getPlaylistId(url);
        if (!playlistId) throw new Error('Érvénytelen YouTube Playlist URL. A linknek tartalmaznia kell egy "list=..." paramétert.');
        }

        let allTracks = [];
        let playlistName = 'YouTube_Lista';
        let page = 1;

        try {
            progressCallback(page);
            const initialUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
            const response = await fetch(`${this.proxyUrl}${encodeURIComponent(initialUrl)}`);
            if (!response.ok) throw new Error(`Nem sikerült elérni a YouTube oldalt. (Státusz: ${response.status})`);
            
            const html = await response.text();
            
            const match = html.match(/var ytInitialData = (.*?);<\/script>/);
            if (!match || !match[1]) throw new Error('Nem sikerült a lejátszási lista adatait kinyerni az oldalról. A lista lehet privát, nem létező, vagy a formátuma ismeretlen.');
            
            const initialData = JSON.parse(match[1]);
            
            let continuation = null;
            let isMusicPlaylist = false;

            // Try to parse as Music Playlist first (watch page structure)
            const musicPlaylistData = initialData.contents?.twoColumnWatchNextResults?.playlist?.playlist;
            if (musicPlaylistData) {
                isMusicPlaylist = true;
                playlistName = musicPlaylistData.title || playlistName;
                const items = musicPlaylistData.contents || [];
                allTracks.push(...this.extractTracksFromItems(items));
                continuation = items.find(c => c.continuationItemRenderer)?.continuationItemRenderer?.continuationEndpoint;
            } 
            // Fallback to Standard Playlist (browse page structure)
            else {
                const standardContents = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content;
                playlistName = initialData.metadata?.playlistMetadataRenderer?.title || playlistName;
                const items = standardContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
                allTracks.push(...this.extractTracksFromItems(items));
                continuation = items.find(c => c.continuationItemRenderer)?.continuationItemRenderer?.continuationEndpoint;
            }

            // Paginate if there's a continuation token
            while (continuation) {
                page++;
                if (progressCallback) progressCallback(page);

                const continuationUrl = `https://www.youtube.com/browse_ajax`;
                const continuationBody = {
                    context: { client: { clientName: 'WEB', clientVersion: '2.20210721.00.00' }},
                    continuation: continuation.continuationCommand.token
                };

                const continuationResponse = await fetch(`${this.proxyUrl}${encodeURIComponent(continuationUrl)}`, {
                    method: 'POST',
                    body: JSON.stringify(continuationBody)
                });

                if (!continuationResponse.ok) break;

                const continuationJson = await continuationResponse.json();
                
                // The structure for appended items seems to be consistent for both playlist types
                const newItems = continuationJson.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
                
                allTracks.push(...this.extractTracksFromItems(newItems));
                continuation = newItems.find(c => c.continuationItemRenderer)?.continuationItemRenderer?.continuationEndpoint;
            }

            return { tracks: allTracks, name: playlistName };

        } catch (err) {
            console.error("YouTube Fetch Error:", err);
            throw err;
        }
    }
}