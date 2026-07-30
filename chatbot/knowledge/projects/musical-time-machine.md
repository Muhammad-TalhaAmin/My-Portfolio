# 🎵 Musical Playlist Generator

An automated playlist generation tool that converts Billboard Hot 100 charts into YouTube Music playlists.

## 🎮 Overview
Creates personalized playlists from current music charts, automatically searching YouTube Music for each song and adding them to private playlists. Perfect for discovering new music and preserving weekly chart moments.

## 🌟 Key Features
- **Chart Integration**: Pulls real-time data from Billboard Hot 100
- **YouTube Music Sync**: Automatically creates and populates playlists
- **Error Handling**: Skips unavailable songs with informative messages
- **Playlist Management**: Creates private playlists dated for easy organization
- **Batch Processing**: Handles multiple songs efficiently
- **Privacy First**: Works with private music libraries

## 🛠️ Technologies Used
- **Programming Language:** Python
- **Web Scraping:** BeautifulSoup for HTML parsing
- **API Integration:** YTMusicAPI for YouTube Music interaction
- **HTTP Requests:** Requests library for web scraping
- **File Storage:** JSON file for browser authentication

## 📁 Project Structure
```
day46_musicalplaylist/
├── main.py              # Main application logic
├── browser.json         # Browser authentication storage
├── pyproject.toml       # Dependencies
├── uv.lock              # Dependency locks
├── README.md            # This readme
└── assets/              # Optional: additional resources
```

## 🚀 How to Use
1. **Prerequisites:**
   - Install Python 3.7+
   - Set up YTMusicAPI

2. **Initial Setup (One-time):**
   - **Mac:** `pbpaste | ytmusicapi browser`
   - **Windows:** `ytmusicapi browser`
   - Copy Firefox request headers when prompted
   - This creates `browser.json` with authentication data

3. **Run the Application:**
   ```bash
   python main.py
   ```

4. **Usage:**
   - Enter date in format `YYYY-MM-DD`
   - Choose date's Billboard chart
   - Watch songs automatically added to YouTube Music playlist

## 🔧 Technical Implementation

### Web Scraping
```python
# Get Billboard chart data
header = {"User-Agent": "Mozilla/5.0..."}
response = requests.get(f"https://appbrewery.github.io/bakeboard-hot-100/{date}", headers=header)
soup = BeautifulSoup(content, "html.parser")
songs = soup.find_all(name="h3", class_="chart-entry__title")
songs_list = [name.getText() for name in songs]
```

### YouTube Music API
```python
# Initialize YTMusic with authentication
from ytmusicapi import YTMusic
yt = YTMusic("browser.json")

# Search and add songs
search_results = yt.search(song, filter="songs", limit=1)
yt.add_playlist_items(playlistID, [search_results[0]['videoId']], duplicates=False)
```

### Playlist Management
```python
# Create new playlist
playlistID = yt.create_playlist(
    f"{date} Billboard",
    "Musical Time Machine",
    privacy_status="PRIVATE"
)
```

## 📊 Features Explained

### Data Processing
- **Date Input:** Converts date to playlist name
- **Song Extraction:** Parses HTML for song titles
- **Music Search:** Searches YouTube Music for each song
- **Playlist Creation:** Creates dated playlists for organization

### Music Discovery
- **Automatic Search:** Finds songs across YouTube Music library
- **Smart Detection:** Skips unavailable or copyrighted content
- **Duplicate Prevention:** Uses `duplicates=False` parameter

### Authentication
- **One-time Setup:** Browser headers stored in `browser.json`
- **Private Playlists:** Created as private for personal use
- **Secure Storage:** Authentication data encrypted

## 💡 Key Components

### Main Application (`main.py`)
- **Authentication Check:** Validates `browser.json` existence
- **Input Handling:** Gets date for chart selection
- **Chart Processing:** Scrapes Billboard for songs
- **Playlist Management:** Creates and populates playlists
- **Error Handling:** Graceful song skipping

### Error Handling
```python
try:
    search_results = yt.search(song, filter="songs", limit=1)
    yt.add_playlist_items(playlistID, [search_results[0]['videoId']], duplicates=False)
    print(f"SONG ADDED: {song}")
except Exception as e:
    print(f"Skipped {song} due to : {e}")
```

## 🏆 Learning Outcomes
This project demonstrates:
- Web scraping with BeautifulSoup
- API integration with authentication
- Data transformation and processing
- Error handling and recovery
- File-based authentication management

## 📝 Future Enhancements
- **Playlist Analytics:** Track playlist performance and statistics
- **Schedule Automation:** Automatic weekly playlist generation
- **Multi-Platform Support:** Add Spotify, Apple Music integration
- **Smart Curation:** AI-based playlist recommendations
- **Export Features:** Share playlists across platforms
- **Chart Comparison:** Compare different chart versions

## ⚡ Performance Considerations
- **Batch Processing:** Efficient search and addition
- **Memory Management:** Stream processing for large playlists
- **Rate Limiting:** Respects API rate limits
- **Error Resilience:** Continues processing even if some songs fail

---
*Built with Python, BeautifulSoup, and YTMusicAPI | Automates music discovery | Perfect for learning web scraping and API integration*
