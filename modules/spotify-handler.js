// modules/spotify-handler.js

/**
 * Extracts the Spotify ID from a URL, mimicking the provided Python script's logic.
 * This is more robust against URLs with query parameters.
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
        console.error("Could not parse Spotify URL:", url, e);
        return null;
    }
    return null;
}


/**
 * Cleans up track titles by removing common extra information like (Remastered), etc.
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
     * Retrieves a valid access token, requesting a new one if the old one is missing or expired.
     */
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
                throw new Error(`Nem sikerült hitelesíteni a Spotify-jal (${response.status}): ${errorBody.error_description || 'Ellenőrizd az API kulcsokat.'}`);
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

    /**
     * Fetches all items from a paginated Spotify API endpoint, with a retry mechanism for 404 errors.
     * @param {string} initialUrl - The starting URL for the API endpoint.
     * @param {string} token - The Spotify access token.
     * @param {number} retries - The number of times to retry on a 404 error.
     * @returns {Promise<Array>} A promise that resolves to an array of all items.
     */
    async fetchAllPaginatedData(initialUrl, token, retries = 3) {
        let allItems = [];
        let nextUrl = initialUrl;

        while (nextUrl) {
            let response;
            for (let attempt = 1; attempt <= retries; attempt++) {
                response = await fetch(nextUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status !== 404 || attempt === retries) {
                    break;
                }
                
                console.warn(`Spotify API 404-es hibát adott. Újrapróbálkozás... (${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: { message: "Ismeretlen hiba." } }));
                const errorMessage = errorBody.error?.message || "Ismeretlen hiba.";
                if (response.status === 404) {
                    throw new Error(`A megadott Spotify lista vagy album nem található (404). Ellenőrizd a linket. (${errorMessage})`);
                }
                throw new Error(`Hiba a Spotify adatok lekérése közben (${response.status}): ${errorMessage}`);
            }

            const data = await response.json();
            const items = data.items || [];
            allItems = allItems.concat(items);
            nextUrl = data.next;
        }
        return allItems;
    }


    /**
     * Main function to fetch and process data from a Spotify playlist or album URL.
     * @param {string} url - The URL of the Spotify resource.
     * @returns {Promise<{tracks: Array, name: string}>}
     */
    async fetchSpotifyData(url) {
        const resource = getSpotifyId(url);
        if (!resource) {
            throw new Error("Érvénytelen Spotify URL. Kérlek, 'playlist' vagy 'album' linket használj.");
        }

        const token = await this.getAccessToken();
        let resourceName = 'Spotify Lista';
        let allItems = [];

        try {
            let tracksUrl, detailsUrl;
            if (resource.type === 'playlist') {
                detailsUrl = `https://api.spotify.com/v1/playlists/${resource.id}?fields=name`;
                tracksUrl = `https://api.spotify.com/v1/playlists/${resource.id}/tracks?limit=50`;
            } else { // album
                detailsUrl = `https://api.spotify.com/v1/albums/${resource.id}?fields=name`;
                tracksUrl = `https://api.spotify.com/v1/albums/${resource.id}/tracks?limit=50`;
            }
            
            // Fetch resource name
            const detailsResponse = await fetch(detailsUrl, { headers: { 'Authorization': 'Bearer ' + token }});
            if (detailsResponse.ok) {
                 resourceName = (await detailsResponse.json()).name;
            } else {
                 console.warn("Could not fetch playlist/album name.");
            }
            
            // Fetch all tracks
            allItems = await this.fetchAllPaginatedData(tracksUrl, token);
            
            const tracks = allItems.map(item => {
                const track = (resource.type === 'playlist') ? item.track : item;
                if (!track || !track.artists || track.artists.length === 0) return null;

                const album = (resource.type === 'playlist') ? item.track?.album : null;
                // For albums, the track object doesn't contain the album details, so we can't get the year this way.
                // We'll rely on Discogs for year validation anyway.
                const year = album?.release_date ? album.release_date.substring(0, 4) : '????';
                
                const artist = track.artists.map(a => a.name).join(' & ');
                const title = cleanTrackTitle(track.name);
                const qr = track.preview_url || track.external_urls?.spotify || url;

                return { artist, title, year, qr_data: qr, source: 'spotify' };
            }).filter(Boolean);
            
            return { tracks, name: resourceName };

        } catch (error) {
            console.error("Spotify Fetch Error:", error);
            // Re-throw the specific, user-friendly error
            throw error;
        }
    }
}