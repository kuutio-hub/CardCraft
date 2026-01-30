// modules/discogs-handler.js

// Helper to safely clean song titles for searching
function cleanSearchTerm(name) {
    if (!name) return "";
    let term = name;
    // Remove common bracketed terms that confuse search APIs
    const patternsToRemove = [
        /\(.*\)/i,
        /\[.*\]/i
    ];
    patternsToRemove.forEach(pattern => {
        term = term.replace(pattern, '');
    });
    return term.trim();
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class DiscogsHandler {
    constructor(consumerKey, consumerSecret) {
        this.key = consumerKey;
        this.secret = consumerSecret;
        this.userAgent = `CardCraft/v0.3.6 (https://github.com/CardCraft/app)`;
    }

    async getEarliestYearFromMaster(masterId) {
        if (!masterId) return null;
        
        // Wait before the next API call to respect rate limits
        await wait(1100);

        const versionsUrl = `https://api.discogs.com/masters/${masterId}/versions?per_page=50&page=1&key=${this.key}&secret=${this.secret}`;
        
        try {
            const response = await fetch(versionsUrl, { headers: { 'User-Agent': this.userAgent } });
            if (!response.ok) return null;

            const data = await response.json();
            if (!data.versions || data.versions.length === 0) return null;

            let earliestYear = null;
            for (const version of data.versions) {
                const year = parseInt(version.year, 10);
                if (year && (!earliestYear || year < earliestYear)) {
                    earliestYear = year;
                }
            }
            return earliestYear;
        } catch (e) {
            console.error(`Error fetching versions for master ${masterId}:`, e);
            return null;
        }
    }

    async searchTrackYear(artist, title) {
        const cleanedArtist = cleanSearchTerm(artist);
        const cleanedTitle = cleanSearchTerm(title);
        
        if (!cleanedArtist || !cleanedTitle) return null;

        const query = encodeURIComponent(`${cleanedArtist} - ${cleanedTitle}`);
        const searchUrl = `https://api.discogs.com/database/search?q=${query}&type=master&per_page=3&page=1&key=${this.key}&secret=${this.secret}`;
        
        try {
            // Wait before the first API call
            await wait(1100);

            const searchResponse = await fetch(searchUrl, { headers: { 'User-Agent': this.userAgent } });
            if (!searchResponse.ok) {
                console.error(`Discogs search failed with status: ${searchResponse.status}`);
                return null;
            }

            const searchData = await searchResponse.json();
            if (!searchData.results || searchData.results.length === 0) {
                return null;
            }

            // Get the year from the first master release if possible, it's usually the most relevant
            const firstMaster = searchData.results[0];
            if (firstMaster.id) {
                const masterYear = await this.getEarliestYearFromMaster(firstMaster.id);
                if (masterYear) {
                    return masterYear;
                }
            }

            // Fallback to the year in the search results if master version check fails
            let fallbackYear = null;
            for (const item of searchData.results) {
                const year = parseInt(item.year, 10);
                if (year && (!fallbackYear || year < fallbackYear)) {
                    fallbackYear = year;
                }
            }
            
            return fallbackYear;

        } catch (e) {
            console.error("Error searching Discogs:", e);
            return null;
        }
    }
}