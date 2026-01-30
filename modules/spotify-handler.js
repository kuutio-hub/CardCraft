// modules/spotify-handler.js

// Helper to extract ID from URL
function getSpotifyId(url) {
    if (!url) return null;
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
    
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
    if (albumMatch) return { type: 'album', id: albumMatch[1] };
    
    return null;
}

// Helper to safely clean song titles
function cleanTrackTitle(name) {
    if (!name) return "";
    let title = name;

    const patternsToRemove = [
        /\s-\s.*(remaster|radio edit|live|version|mono|stereo|explicit|clean|single).*/i,
        /\s\(.*(remaster|radio edit|live|version|mono|stereo|acoustic|explicit|clean|feat|ft|from|with).*\)/i,
        /\s\[.*(remaster|radio edit|live|version|mono|stereo|acoustic|explicit|clean|feat|ft|from|with).*\]/i
    ];

    patternsToRemove.forEach(pattern => {
        title = title.replace(pattern, '');
    });

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
            throw new Error('Nincsenek beállítva a Spotify API kulcsok. Kérlek, add meg őket a Beállítások > API Kulcsok menüpontban.');
        }

        const authHeader = btoa(`${clientId}:${clientSecret}`);

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Spotify Auth Error:", response.status, errorBody);
            throw new Error(`Nem sikerült hitelesíteni a Spotify-jal. Ellenőrizd a megadott API kulcsokat.\n\nHiba (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
        
        return this.accessToken;
    }
    
    async searchTrack(artist, title) {
        const cleanedTitle = cleanTrackTitle(title);
        const userAgent = `CardCraft/2.4.0 (cardcraft.app/info)`;
        const url = `https://musicbrainz.org/ws/2/recording/?query=artist:"${encodeURIComponent(artist)}" AND recording:"${encodeURIComponent(cleanedTitle)}"&limit=5&fmt=json`;
        
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': userAgent }
            });

            if (!response.ok) {
                console.error(`MusicBrainz API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (!data.recordings || data.recordings.length === 0) {
                return null;
            }
            
            const recording = data.recordings[0]; 
            
            if (recording.releases && recording.releases.length > 0) {
                const firstReleaseDates = recording.releases
                    .filter(r => r['release-group'] && r['release-group']['first-release-date'])
                    .map(r => r['release-group']['first-release-date']);
                
                const uniqueFirstReleaseDates = [...new Set(firstReleaseDates)].filter(d => d);

                if (uniqueFirstReleaseDates.length > 0) {
                    uniqueFirstReleaseDates.sort();
                    return uniqueFirstReleaseDates[0].substring(0, 4);
                }
            }
            
            const fallbackDates = recording.releases
                .map(r => r.date)
                .filter(d => d);

            if (fallbackDates.length > 0) {
                fallbackDates.sort();
                return fallbackDates[0].substring(0, 4);
            }

        } catch (error) {
            console.error("Error fetching from MusicBrainz:", error);
            return null;
        }
        
        return null;
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
        let resourceName = 'Spotify_List';

        if (resource.type === 'playlist') {
            nextUrl = `https://api.spotify.com/v1/playlists/${resource.id}/tracks?limit=50`;
            const detailsResponse = await fetch(`https://api.spotify.com/v1/playlists/${resource.id}?fields=name`, { headers: { 'Authorization': 'Bearer ' + token }});
            if (detailsResponse.ok) resourceName = (await detailsResponse.json()).name;

        } else { // album
            nextUrl = `https://api.spotify.com/v1/albums/${resource.id}/tracks?limit=50`;
            const detailsResponse = await fetch(`https://api.spotify.com/v1/albums/${resource.id}?fields=name`, { headers: { 'Authorization': 'Bearer ' + token }});
            if (detailsResponse.ok) resourceName = (await detailsResponse.json()).name;
        }

        try {
            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error("Spotify API Error:", response.status, errorBody);
                    throw new Error(`Hiba a Spotify adatok lekérése közben.\n\nHiba (${response.status}): ${errorBody}`);
                }

                const data = await response.json();
                const items = data.items;

                const mappedTracks = items.map((item) => {
                    const track = item.track ? item.track : item;
                    if (!track || !track.artists) return null;

                    let year = "????";
                    if (track.album && track.album.release_date) {
                        if (track.album.album_type === 'album' || track.album.album_type === 'single') {
                            year = track.album.release_date.substring(0, 4);
                        }
                    }

                    let artist = "Ismeretlen";
                    if (track.artists && track.artists.length > 0) {
                        if (track.artists.length > 2) {
                            artist = track.artists[0].name;
                        } else {
                            artist = track.artists.map(a => a.name).join(' & ');
                        }
                    }
                    
                    const title = cleanTrackTitle(track.name);
                    const qr = track.preview_url || (track.external_urls ? track.external_urls.spotify : url);
                    
                    return { artist, title, year, qr_data: qr, source: 'spotify' };
                }).filter(Boolean);

                allTracks.push(...mappedTracks);
                nextUrl = data.next;
            }
            
            if (resource.type === 'album' && allTracks.length > 0) {
                 const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${resource.id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const albumData = await albumResponse.json();
                const albumYear = albumData.release_date.substring(0, 4);
                allTracks.forEach(track => {
                    if (track.year === "????") {
                        track.year = albumYear;
                    }
                });
            }

            return { tracks: allTracks, name: resourceName };

        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}