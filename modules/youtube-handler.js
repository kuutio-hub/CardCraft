// modules/youtube-handler.js

function getPlaylistId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2]) {
        return match[2];
    }
    return null;
}

function parseTitle(title) {
    if (!title) return { artist: 'Ismeretlen', title: 'Ismeretlen' };

    // Remove content in parentheses and brackets (e.g., [Official Video], (Lyrics))
    let cleanTitle = title.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();

    // Common separators: " - ", " – ", " — ", ":"
    const separators = [' - ', ' – ', ' — ', ': '];
    let artist = 'Ismeretlen';
    let trackTitle = cleanTitle;

    for (const sep of separators) {
        const parts = cleanTitle.split(sep);
        if (parts.length > 1) {
            artist = parts[0].trim();
            trackTitle = parts.slice(1).join(sep).trim();
            return { artist, title: trackTitle };
        }
    }

    // Fallback if no separator is found
    return { artist, title: trackTitle };
}

export class YoutubeHandler {
    constructor() {
        this.apiKey = null;
    }

    getApiKey() {
        if (this.apiKey) return this.apiKey;
        const key = localStorage.getItem('cardcraft_youtube_key');
        if (!key) {
            throw new Error('Nincs beállítva a YouTube API kulcs. Kérlek, add meg a Beállítások > API Kulcsok menüpontban.');
        }
        this.apiKey = key;
        return key;
    }

    async fetchYouTubeData(url) {
        const apiKey = this.getApiKey();
        const playlistId = getPlaylistId(url);

        if (!playlistId) {
            throw new Error('Érvénytelen YouTube Playlist URL. Csak a lejátszási listák linkjei támogatottak.');
        }

        let allTracks = [];
        let nextPageToken = null;
        let playlistName = 'YouTube_Lista';

        // First, get playlist name
        try {
            const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
            const detailsResponse = await fetch(playlistDetailsUrl);
            if(detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                if (detailsData.items && detailsData.items.length > 0) {
                    playlistName = detailsData.items[0].snippet.title;
                }
            }
        } catch (e) {
            console.warn("Could not fetch playlist name", e);
        }


        // Then, fetch playlist items with pagination
        try {
            do {
                let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
                if (nextPageToken) {
                    apiUrl += `&pageToken=${nextPageToken}`;
                }

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error("YouTube API Error:", response.status, errorBody);
                     throw new Error(`Hiba a YouTube adatok lekérése közben.\n\nHiba (${response.status}): ${errorBody}`);
                }
                
                const data = await response.json();

                const mappedTracks = data.items.map(item => {
                    if (!item.snippet || !item.snippet.title || item.snippet.title === "Private video" || item.snippet.title === "Deleted video") {
                        return null;
                    }

                    const { artist, title } = parseTitle(item.snippet.title);
                    const videoId = item.snippet.resourceId.videoId;
                    const qr = `https://www.youtube.com/watch?v=${videoId}`;

                    return { artist, title, year: '????', qr_data: qr, source: 'youtube' };
                }).filter(Boolean); // Remove nulls from deleted/private videos

                allTracks.push(...mappedTracks);
                nextPageToken = data.nextPageToken;

            } while (nextPageToken);

            return { tracks: allTracks, name: playlistName };

        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}