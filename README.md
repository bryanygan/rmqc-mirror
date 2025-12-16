# RMQC Mirror Website

This is a static mirror website for https://rmqc.x.yupoo.com/albums

## Status

✅ **Currently Working:**
- Album listing page showing all 120 albums with cover images
- 1 album (8202663 / ID: 220231397) fully functional with all 11 images
- Clean, responsive design matching the original site's layout

⚠️ **Partially Working:**
- 119 albums show in the listing but don't have gallery images yet
- To get full image data for these albums, you need to download their individual album pages

## Project Structure

```
mirror-site/
├── index.html              # Main album listing page
├── gallery.html            # Individual album gallery viewer
├── albums.json             # Album data (120 albums)
├── extract_albums.py       # Python script to extract album data from downloaded HTML
├── rmqc/                   # Downloaded Yupoo pages
│   ├── rmqc _ Yupoo.html   # Main albums listing (120 albums)
│   ├── rmqc _ Yupoo_files/ # Downloaded images and assets
│   └── 8202663/            # Individual album folder
│       └── a853a7acd48486a27d4a0a1f2a93b5b8.jpg _ Yupoo.html
└── README.md               # This file
```

## How to Use

### 1. View the Mirror Website

Start a local web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using PHP
php -S localhost:8000
```

Then open your browser to:
- Main page: http://localhost:8000/index.html
- Gallery example: http://localhost:8000/gallery.html?id=220231397

### 2. Add More Albums

To mirror additional albums:

1. **Download an album page:**
   - Visit the album on Yupoo (e.g., https://rmqc.x.yupoo.com/albums/ALBUM_ID?uid=1)
   - Save the page as HTML (File > Save Page As > Webpage, Complete)

2. **Organize the downloaded files:**
   - Create a folder in `rmqc/` with a memorable name (e.g., the album ID or title)
   - Move the downloaded HTML file into that folder

3. **Extract the data:**
   ```bash
   python3 extract_albums.py
   ```

   This will:
   - Parse all downloaded album pages
   - Update `albums.json` with new image data
   - Preserve existing data

### 3. Update the Main Albums Listing

If you want to get more albums beyond the initial 120:

1. **Download additional pages:**
   - The original site has pagination (see line 19 in rmqc _ Yupoo.html: `<link rel="next" href="https://rmqc.x.yupoo.com/albums?page=2">`)
   - Download page 2, 3, etc. by visiting: https://rmqc.x.yupoo.com/albums?page=2

2. **Update the extraction script:**
   - Modify `extract_albums.py` to also parse these additional pages
   - Or replace `rmqc _ Yupoo.html` with the new page before running the script

## Technical Details

### Album Data Structure

The `albums.json` file contains:

```json
{
  "albums": [
    {
      "id": "220231397",
      "title": "8202663",
      "cover": "https://photo.yupoo.com/rmqc/4c321195/medium.jpg",
      "images": [
        {
          "small": "https://photo.yupoo.com/rmqc/4c321195/small.jpg",
          "big": "https://photo.yupoo.com/rmqc/4c321195/big.jpg"
        }
      ]
    }
  ]
}
```

- **id**: Yupoo album ID
- **title**: Album title/name
- **cover**: Cover image (local path for albums from listing, Yupoo URL for detailed albums)
- **images**: Array of image objects with small (thumbnail) and big (full size) URLs

### How It Works

1. **index.html** - Fetches `albums.json` and displays album cards with cover images
2. **gallery.html** - Reads the album ID from URL params, finds the album in `albums.json`, and displays all images
3. **extract_albums.py** - Parses downloaded HTML files to extract album metadata and image URLs

## Next Steps

To create a complete mirror:

1. Download more individual album pages (for the 119 albums without images)
2. Run `extract_albums.py` after each batch of downloads
3. Consider downloading multiple pages of the albums listing if there are more than 120 albums

## Notes

- All image URLs from detailed albums point to Yupoo's CDN (photo.yupoo.com)
- Cover images for albums from the listing are stored locally in `rmqc/rmqc _ Yupoo_files/`
- The extraction script preserves existing data, so you can run it multiple times safely
- Album with ID 220231397 is fully functional as an example

## Troubleshooting

**Issue**: Albums show in listing but clicking them shows "Album not found"
- **Solution**: The album doesn't have image data. Download its page from Yupoo and run `extract_albums.py`

**Issue**: Images don't load
- **Solution**: Check if you're running a local server. Opening HTML files directly (file://) won't work due to CORS

**Issue**: Script doesn't find albums
- **Solution**: Make sure HTML files are in the correct folder structure and named correctly
