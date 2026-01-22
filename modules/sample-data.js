// Generátor script a mintaadatokhoz
const artists = ["Queen", "Michael Jackson", "Madonna", "The Beatles", "Led Zeppelin", "Pink Floyd", "U2", "Nirvana", "Metallica", "AC/DC", "David Bowie", "Prince", "Elton John", "The Rolling Stones", "Fleetwood Mac", "Eagles", "Bee Gees", "ABBA", "Whitney Houston", "Mariah Carey", "Celine Dion", "Adele", "Beyoncé", "Taylor Swift", "Ed Sheeran", "Drake", "Eminem", "Rihanna", "Katy Perry", "Lady Gaga"];
const titles = ["Bohemian Rhapsody", "Billie Jean", "Like a Prayer", "Hey Jude", "Stairway to Heaven", "Another Brick in the Wall", "With or Without You", "Smells Like Teen Spirit", "Enter Sandman", "Back in Black", "Heroes", "Purple Rain", "Rocket Man", "Paint It Black", "Dreams", "Hotel California", "Stayin' Alive", "Dancing Queen", "I Will Always Love You", "All I Want for Christmas", "My Heart Will Go On", "Rolling in the Deep", "Crazy in Love", "Shake It Off", "Shape of You", "God's Plan", "Lose Yourself", "Umbrella", "Firework", "Bad Romance"];

const data = [];
for (let i = 0; i < 120; i++) {
    const artist = artists[i % artists.length];
    const title = titles[i % titles.length];
    const year = 1970 + (i % 55);
    data.push({
        year: year,
        artist: artist,
        title: title,
        qr_data: `https://example.com/song/${i}`,
        code1: `${artist.substring(0,2).toUpperCase()}-${(i+1).toString().padStart(2, '0')}`,
        code2: `${year.toString().slice(-2)}-${title.substring(0,2).toUpperCase()}`
    });
}

export default data;