# RMQC Mirror Website

This is a static mirror website for https://rmqc.x.yupoo.com/albums

## Status

✅ **Fully Working:**
- **8,639 albums** mirrored from all 72 pages of the original website
- **72-page pagination** system matching the original site (120 albums per page)
- All albums display with cover images
- 1 album (8202663 / ID: 220231397) has full gallery with all 11 images
- Clean, responsive design with page navigation

⚠️ **Partially Working:**
- 8,638 albums show in listings but need individual album pages downloaded for full galleries
- To get full image data, download individual album pages and run the extraction script

## Project Structure

```
mirror-site/
├── index.html              # Main album listing page with pagination
├── gallery.html            # Individual album gallery viewer
├── albums.json             # Album data (8,639 albums from 72 pages)
├── download_pages.py       # Script to download all pages from Yupoo
├── extract_all_albums.py   # Script to extract all album data from downloaded pages
├── extract_albums.py       # Legacy script (kept for compatibility)
├── pages/                  # Downloaded listing pages (72 pages)
│   ├── page_1.html
│   ├── page_2.html
│   └── ... (72 pages total)
├── rmqc/                   # Downloaded Yupoo pages
│   ├── rmqc _ Yupoo.html   # Original listing page (page 1)
│   ├── rmqc _ Yupoo_files/ # Downloaded images and assets
│   └── 8202663/            # Individual album folder
│       └── [album HTML]
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
- Main page (Page 1): http://localhost:8000/index.html
- Page 2: http://localhost:8000/index.html?page=2
- Page 72: http://localhost:8000/index.html?page=72
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
   python3 extract_all_albums.py
   ```

   This will:
   - Parse all downloaded album pages
   - Update `albums.json` with new image data
   - Preserve existing data from all 72 pages

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

To get full image galleries for all albums:

1. Download individual album pages (for the 8,638 albums that only have covers)
2. Run `extract_all_albums.py` after each batch of downloads
3. All 72 pages of listings are already mirrored!

## Notes

- All image URLs from detailed albums point to Yupoo's CDN (photo.yupoo.com)
- Cover images point to Yupoo's CDN for all 8,639 albums
- The extraction script preserves existing data, so you can run it multiple times safely
- Album with ID 220231397 is fully functional as an example
- **72 pages** match the original Yupoo website exactly
- **120 albums per page** (except page 72 which has 119)

## Troubleshooting

**Issue**: Albums show in listing but clicking them shows "Album not found"
- **Solution**: The album doesn't have image data. Download its page from Yupoo and run `extract_albums.py`

**Issue**: Images don't load
- **Solution**: Check if you're running a local server. Opening HTML files directly (file://) won't work due to CORS

**Issue**: Script doesn't find albums
- **Solution**: Make sure HTML files are in the correct folder structure and named correctly

**Issue**: Need to re-download all pages
- **Solution**: Run `python3 download_pages.py` - it will skip already downloaded pages
