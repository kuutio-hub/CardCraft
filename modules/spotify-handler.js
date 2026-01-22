// modules/spotify-handler.js

// Obfuscated credentials for Client Credentials Flow
// This is the Base64 encoding of "CLIENT_ID:CLIENT_SECRET"
const B64_SECRET = 'YjI0YWNhMTZlNjY3NGM1NGI5MGNkMjk4ZTVmODFiYTM6MWJmODZhYTM2NWMzNGE2NGFiMWNjM2E3ZmM0ODAxM2I=';

// Helper to extract ID from URL
function getSpotifyId(url) {
    if (!url) return null;
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
    
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
    if (albumMatch) return { type: 'album', id: albumMatch[1] };
    
    return null;
}

export class SpotifyHandler {
    constructor() {
        this.accessToken = null;
        this.tokenExpiryTime = 0; // Unix timestamp
    }

    async getAccessToken() {
        // If we have a valid token, return it
        if (this.accessToken && Date.now() < this.tokenExpiryTime) {
            return this.accessToken;
        }

        // Otherwise, fetch a new one
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${B64_SECRET}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error('Nem sikerült hitelesíteni a Spotify-jal.');
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        // Set expiry time (token lifetime is in seconds, convert to ms and add a small buffer)
        this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
        
        return this.accessToken;
    }

    async fetchSpotifyData(url) {
        const token = await this.getAccessToken();
        if (!token) {
            throw new Error("Sikertelen Spotify hitelesítés.");
        }

        const resource = getSpotifyId(url);
        if (!resource) {
            throw new Error("Érvénytelen Spotify URL. Csak Playlist vagy Album linkek támogatottak.");
        }

        let allTracks = [];
        let nextUrl;

        if (resource.type === 'playlist') {
            nextUrl = `https://api.spotify.com/v1/playlists/${resource.id}/tracks?limit=50`;
        } else { // album
            nextUrl = `https://api.spotify.com/v1/albums/${resource.id}/tracks?limit=50`;
        }

        try {
            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!response.ok) {
                    throw new Error("Spotify API hiba: " + response.statusText);
                }

                const data = await response.json();
                const items = data.items;

                const mappedTracks = items.map((item) => {
                    const track = item.track ? item.track : item;
                    if (!track || !track.artists) return null;

                    let year = "N/A";
                    if (track.album && track.album.release_date) {
                        year = track.album.release_date.substring(0, 4);
                    }

                    // --- SMART DATA CLEANING ---
                    let artist = "Ismeretlen";
                    if (track.artists && track.artists.length > 0) {
                        if (track.artists.length > 2) {
                            artist = track.artists[0].name; // For 3+ artists, use only the primary
                        } else {
                            artist = track.artists.map(a => a.name).join(' & '); // For 1 or 2 artists
                        }
                    }
                    
                    // Smartly shorten title by removing versions/edits
                    const title = track.name.replace(/\s*([-–(].*|\[.*\])/, '').trim();

                    // Use 30-second preview URL if available, otherwise fall back to full track URL
                    const qr = track.preview_url || (track.external_urls ? track.external_urls.spotify : url);
                    
                    return { 
                        artist, 
                        title, 
                        year, 
                        qr_data: qr, 
                        source: 'spotify' // Flag to identify data origin
                    };
                }).filter(Boolean); // Remove nulls if a track was invalid

                allTracks.push(...mappedTracks);
                nextUrl = data.next; // URL for the next page of results, or null
            }
            
            // If album, we need to fetch the release year separately.
            if (resource.type === 'album' && allTracks.length > 0) {
                 const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${resource.id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const albumData = await albumResponse.json();
                const albumYear = albumData.release_date.substring(0, 4);
                allTracks.forEach(track => {
                    if (track.year === "N/A") {
                        track.year = albumYear;
                    }
                });
            }

            return allTracks;

        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}