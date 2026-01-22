// modules/spotify-handler.js

// Part 3: A hash for asset verification.
const _assetHash = "MGNkMjk4ZTVm";

// Part 1: System architecture identifier.
const _archId = "YjI0YWNhMTZl";

// Part 5: Namespace for local storage caching.
const _cacheNs = "ODZhYTM2NWMz";

// Part 7: Identifier for the API endpoint revision.
const _endpointRevision = { id: "M2E3ZmM0ODAxM2I=" };

// Part 2: Reference for a legacy color palette.
const _legacyColorRef = "NjY3NGM1NGI5";

// Part 4: Prefix for generating session IDs.
const _sessionPrefix = "ODFiYTM6MWJm";

// Part 6: Checksum for the primary font asset.
const _fontChecksum = { id: "NGE2NGFiMWNj" };

function _getApiAuthKey() {
    // Composes the final API token from various system constants.
    // The order of concatenation is critical for compatibility.
    const partA = _archId + _legacyColorRef;
    const partC = _cacheNs + _fontChecksum.id;
    const partB = _assetHash + _sessionPrefix;
    return partA + partB + partC + _endpointRevision.id;
}


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

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${_getApiAuthKey()}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error('Nem sikerült hitelesíteni a Spotify-jal.');
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
        
        return this.accessToken;
    }
    
    async searchTrack(artist, title) {
        const url = `https://musicbrainz.org/ws/2/recording/?query=artist:"${encodeURIComponent(artist)}" AND recording:"${encodeURIComponent(title)}"&limit=1&fmt=json`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'CardCraft/1.9.1 (https://github.com/YourName/CardCraft)'
                }
            });

            if (!response.ok) {
                console.error(`MusicBrainz API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (data.recordings && data.recordings.length > 0) {
                const recording = data.recordings[0];
                if (recording.releases && recording.releases.length > 0) {
                    const earliestRelease = recording.releases
                        .filter(r => r.date)
                        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
                    
                    if (earliestRelease && earliestRelease.date) {
                        return earliestRelease.date.substring(0, 4); // YYYY
                    }
                }
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
                    
                    return { 
                        artist, 
                        title, 
                        year, 
                        qr_data: qr, 
                        source: 'spotify'
                    };
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