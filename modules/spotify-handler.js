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

                const mappedTracks = items.map((item, index) => {
                    const track = item.track ? item.track : item;
                    if (!track || !track.artists) return null;

                    let year = "N/A";
                    // Playlists provide full album info, albums do not. For albums, we'd need another API call.
                    if (track.album && track.album.release_date) {
                        year = track.album.release_date.substring(0, 4);
                    }

                    const artist = track.artists.map(a => a.name).join(', ');
                    const title = track.name;
                    const qr = track.external_urls ? track.external_urls.spotify : url;

                    const globalIndex = allTracks.length + index;
                    const code1 = `${artist.substring(0, 2).toUpperCase()}-${(globalIndex + 1).toString().padStart(2, '0')}`;
                    const code2 = `${year.toString().slice(-2)}-${title.substring(0, 2).toUpperCase()}`;

                    return { artist, title, year, qr_data: qr, code1, code2 };
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
                        track.code2 = `${albumYear.toString().slice(-2)}-${track.title.substring(0, 2).toUpperCase()}`;
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