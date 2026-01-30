// modules/spotify-handler.js

function getSpotifyId(url) {
    if (!url) return null;
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
    
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
    if (albumMatch) return { type: 'album', id: albumMatch[1] };
    
    return null;
}

function cleanTrackTitle(name) {
    if (!name) return "";
    let title = name;
    const patternsToRemove = [
        /\s-\s.*(remaster|radio edit|live|version|mono|stereo|explicit|clean|single).*/i,
        /\s\(.*(remaster|radio edit|live|version|mono|stereo|acoustic|explicit|clean|feat|ft|from|with).*\)/i,
        /\s\[.*(remaster|radio edit|live|version|mono|stereo|acoustic|explicit|clean|feat|ft|from|with).*\]/i
    ];
    patternsToRemove.forEach(pattern => { title = title.replace(pattern, ''); });
    return title.trim();
}

export class SpotifyHandler {
    constructor() {
        this.accessToken = null;
        this.tokenExpiryTime = 0;
    }

    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiryTime) {
            return this.accessToken;
        }
        
        const clientId = localStorage.getItem('cardcraft_spotify_id');
        const clientSecret = localStorage.getItem('cardcraft_spotify_secret');

        if (!clientId || !clientSecret) {
            throw new Error('Nincsenek beállítva a Spotify API kulcsok. Kérlek, add meg őket a Beállítások > API Kulcsok fülön.');
        }

        const authHeader = btoa(`${clientId}:${clientSecret}`);

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Nem sikerült hitelesíteni a Spotify-jal (${response.status}): ${errorBody.error_description || 'Ellenőrizd a kulcsokat.'}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
            return this.accessToken;

        } catch (error) {
            console.error("Spotify Auth Error:", error);
            throw new Error(`Hálózati hiba a Spotify hitelesítés során. ${error.message}`);
        }
    }

    async fetchAllPaginatedData(initialUrl, token) {
        let allItems = [];
        let nextUrl = initialUrl;

        while (nextUrl) {
            const response = await fetch(nextUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 404) {
                 throw new Error("A megadott Spotify lista vagy album nem található (404). Ellenőrizd a linket.");
            }
            if (!response.ok) {
                 const errorBody = await response.json();
                 throw new Error(`Hiba a Spotify adatok lekérése közben (${response.status}): ${errorBody.error.message}`);
            }

            const data = await response.json();
            allItems = allItems.concat(data.items);
            nextUrl = data.next;
        }
        return allItems;
    }

    async fetchSpotifyData(url) {
        const resource = getSpotifyId(url);
        if (!resource) {
            throw new Error("Érvénytelen Spotify URL. Csak 'playlist' vagy 'album' linkek támogatottak.");
        }

        const token = await this.getAccessToken();
        let resourceName = 'Spotify Lista';
        let allItems = [];

        try {
            if (resource.type === 'playlist') {
                const detailsUrl = `https://api.spotify.com/v1/playlists/${resource.id}?fields=name`;
                const detailsResponse = await fetch(detailsUrl, { headers: { 'Authorization': 'Bearer ' + token }});
                if (detailsResponse.ok) resourceName = (await detailsResponse.json()).name;
                
                const tracksUrl = `https://api.spotify.com/v1/playlists/${resource.id}/tracks?limit=50`;
                allItems = await this.fetchAllPaginatedData(tracksUrl, token);

            } else { // album
                const detailsUrl = `https://api.spotify.com/v1/albums/${resource.id}?fields=name`;
                const detailsResponse = await fetch(detailsUrl, { headers: { 'Authorization': 'Bearer ' + token }});
                if (detailsResponse.ok) resourceName = (await detailsResponse.json()).name;

                const tracksUrl = `https://api.spotify.com/v1/albums/${resource.id}/tracks?limit=50`;
                allItems = await this.fetchAllPaginatedData(tracksUrl, token);
            }
            
            const tracks = allItems.map(item => {
                const track = item.track || item;
                if (!track || !track.artists || track.artists.length === 0) return null;

                const album = item.track?.album;
                const year = album?.release_date ? album.release_date.substring(0, 4) : '????';
                const artist = track.artists.map(a => a.name).join(' & ');
                const title = cleanTrackTitle(track.name);
                const qr = track.preview_url || track.external_urls?.spotify || url;

                return { artist, title, year, qr_data: qr, source: 'spotify' };
            }).filter(Boolean);
            
            return { tracks, name: resourceName };

        } catch (error) {
            console.error("Spotify Fetch Error:", error);
            // Re-throw the specific error from fetchAllPaginatedData or getAccessToken
            throw error;
        }
    }
}