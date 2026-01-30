// modules/spotify-handler.js

// ===================================================================================
// == FONTOS: IDE ÍRD BE A SAJÁT SPOTIFY API KULCSAIDAT A '...' HELYÉRE! ==
// ===================================================================================
// A kulcsokat a Spotify Developer Dashboard-on tudod létrehozni:
// https://developer.spotify.com/dashboard/
//
// 1. Hozz létre egy új alkalmazást.
// 2. Másold ki a "Client ID"-t és a "Client Secret"-et.
// 3. Illeszd be őket az alábbi két sorba.
//
// Később ezt a megoldást egy biztonságosabbra cseréljük.
// ===================================================================================
const SPOTIFY_CLIENT_ID = 'HELYETTESITS_BE_A_CLIENT_ID_VEL';
const SPOTIFY_CLIENT_SECRET = 'HELYETTESITS_BE_A_CLIENT_SECRET_TEL';
// ===================================================================================


/**
 * Extracts the Spotify ID from a URL, robustly handling query parameters.
 * @param {string} url - The Spotify URL for a playlist or album.
 * @returns {{type: string, id: string}|null}
 */
function getSpotifyId(url) {
    if (!url) return null;
    try {
        if (url.includes("playlist/")) {
            const id = url.split("playlist/")[1].split("?")[0];
            return { type: 'playlist', id };
        }
        if (url.includes("album/")) {
            const id = url.split("album/")[1].split("?")[0];
            return { type: 'album', id };
        }
    } catch (e) {
        console.error("Nem sikerült feldolgozni a Spotify URL-t:", url, e);
        return null;
    }
    return null;
}

/**
 * Cleans up track titles by removing common extra information like (Remastered).
 * @param {string} name - The original track title.
 * @returns {string} The cleaned title.
 */
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

    /**
     * Retrieves a valid access token, requesting a new one if needed.
     */
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiryTime) {
            return this.accessToken;
        }
        
        if (SPOTIFY_CLIENT_ID === 'HELYETTESITS_BE_A_CLIENT_ID_VEL' || SPOTIFY_CLIENT_SECRET === 'HELYETTESITS_BE_A_CLIENT_SECRET_TEL') {
            throw new Error('Hiányzó Spotify API kulcsok! Kérlek, add meg őket a modules/spotify-handler.js fájlban.');
        }

        const authHeader = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

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
                throw new Error(`Nem sikerült hitelesíteni a Spotify-jal (${response.status}): ${errorBody.error_description || 'Ellenőrizd az API kulcsokat.'}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
            return this.accessToken;

        } catch (error) {
            console.error("Spotify Auth Hiba:", error);
            throw new Error(`Hálózati hiba a Spotify hitelesítés során. ${error.message}`);
        }
    }

    /**
     * Fetches all items from a paginated Spotify API endpoint.
     * @param {string} initialUrl - The starting URL for the API endpoint.
     * @param {string} token - The Spotify access token.
     * @param {function} progressCallback - Callback for progress updates.
     * @returns {Promise<{items: Array, total: number}>} A promise resolving to all items and total count.
     */
    async fetchAllPaginatedData(initialUrl, token, progressCallback) {
        let allItems = [];
        let nextUrl = initialUrl;
        let total = null;

        while (nextUrl) {
            const response = await fetch(nextUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: { message: "Ismeretlen hiba." } }));
                const errorMessage = errorBody.error?.message || "Ismeretlen hiba.";
                if (response.status === 404) {
                    throw new Error(`A megadott Spotify lista vagy album nem található (404). Ellenőrizd a linket. (${errorMessage})`);
                }
                throw new Error(`Hiba a Spotify adatok lekérése közben (${response.status}): ${errorMessage}`);
            }

            const data = await response.json();
            if (total === null) {
                total = data.total;
            }
            const items = data.items || [];
            allItems = allItems.concat(items);
            nextUrl = data.next;
            if (progressCallback) {
                progressCallback(allItems.length, total);
            }
        }
        return { items: allItems, total };
    }


    /**
     * Main function to fetch and process data from a Spotify URL.
     * @param {string} url - The URL of the Spotify resource.
     * @param {function} progressCallback - Callback for progress updates.
     * @returns {Promise<{tracks: Array, name: string}>}
     */
    async fetchSpotifyData(url, progressCallback) {
        const resource = getSpotifyId(url);
        if (!resource) {
            throw new Error("Érvénytelen Spotify URL. Kérlek, 'playlist' vagy 'album' linket használj.");
        }

        const token = await this.getAccessToken();
        let resourceName = 'Spotify Lista';

        try {
            let tracksUrl, detailsUrl;
            if (resource.type === 'playlist') {
                detailsUrl = `https://api.spotify.com/v1/playlists/${resource.id}?fields=name`;
                tracksUrl = `https://api.spotify.com/v1/playlists/${resource.id}/tracks?limit=50&fields=items(track(name,artists(name),album(release_date),external_urls,preview_url)),next,total`;
            } else { // album
                detailsUrl = `https://api.spotify.com/v1/albums/${resource.id}?fields=name`;
                tracksUrl = `https://api.spotify.com/v1/albums/${resource.id}/tracks?limit=50&fields=items(name,artists(name),external_urls,preview_url),next,total`;
            }
            
            const detailsResponse = await fetch(detailsUrl, { headers: { 'Authorization': 'Bearer ' + token }});
            if (detailsResponse.ok) {
                 resourceName = (await detailsResponse.json()).name;
            }
            
            const { items: allItems } = await this.fetchAllPaginatedData(tracksUrl, token, progressCallback);
            
            const tracks = allItems.map(item => {
                const track = (resource.type === 'playlist') ? item.track : item;
                if (!track || !track.artists || track.artists.length === 0) return null;

                const album = (resource.type === 'playlist') ? track.album : null;
                const year = album?.release_date ? album.release_date.substring(0, 4) : '????';
                
                const artist = track.artists.map(a => a.name).join(' & ');
                const title = cleanTrackTitle(track.name);
                const qr = track.preview_url || track.external_urls?.spotify || url;

                return { artist, title, year, qr_data: qr, source: 'spotify' };
            }).filter(Boolean);
            
            return { tracks, name: resourceName };

        } catch (error) {
            console.error("Spotify Fetch Hiba:", error);
            throw error;
        }
    }
}