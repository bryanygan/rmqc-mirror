# RMQC Yupoo Mirror Website

A complete static mirror of the RMQC Yupoo album collection, featuring 8,639+ pre-order photo albums with full pagination, image galleries, and an intelligent image proxy system.

## Overview

This project archives and displays the entire RMQC Yupoo photo album collection (https://rmqc.x.yupoo.com/albums) as a fully functional static website deployed on Cloudflare Pages. It includes automated scraping tools, data processing scripts, and a responsive frontend with serverless image proxy capabilities.

## Features

- **Complete Archive**: 8,639 unique albums across 72 pages
- **Pagination System**: 120 albums per page matching the original site
- **Image Proxy**: Cloudflare Pages function bypassing CORS restrictions
- **Responsive Design**: Mobile-friendly album cards and galleries
- **Smart Navigation**: Direct page jumps, Previous/Next buttons, and ellipsis shortcuts
- **Gallery Viewer**: Full image galleries for individual albums
- **Optimized Data**: Split JSON files to overcome deployment size limits

## Live Demo

Visit the live site: https://zrqc.zrhauls.com/

Or run locally:
```bash
python3 -m http.server 8000
```
Then navigate to http://localhost:8000

## Project Structure

```
mirror-site/
├── Frontend
│   ├── index.html                 # Main album listing with pagination
│   ├── gallery.html               # Individual album viewer
│   └── wrangler.toml              # Cloudflare Pages configuration
│
├── Data Files (Deployed)
│   ├── albums-index.json          # Lightweight lookup index (776KB)
│   └── albums-data/               # Paginated data files (~18MB total)
│       ├── page-1.json            # Albums 1-120
│       ├── page-2.json            # Albums 121-240
│       └── ... (72 files total)
│
├── Archived Data (Not Deployed)
│   └── albums.json                # Full database (30MB, archived)
│
├── Serverless Functions
│   └── functions/api/image/[[path]].js  # Image proxy handler
│
├── Python Scripts
│   ├── download_pages.py          # Download all 72 pages from Yupoo
│   ├── extract_all_albums.py      # Extract album data from pages
│   ├── extract_albums.py          # Legacy extractor (compatibility)
│   ├── download_album.py          # Download individual album pages
│   ├── split_albums.py            # Split albums.json into page files
│   ├── create_index.py            # Generate albums-index.json
│   └── update_urls_for_proxy.py   # Convert URLs for image proxy
│
├── Downloaded Content (Local Only)
│   ├── pages/                     # 72 listing pages (9.3MB)
│   └── rmqc/                      # Downloaded Yupoo pages (551MB)
│
└── Documentation
    ├── README.md                  # This file
    └── IMPLEMENTATION_SUMMARY.md  # Technical implementation details
```

## Quick Start

### View the Website

**Option 1: Local Development**
```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

**Option 2: Deploy to Cloudflare Pages**
```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy (from project root)
wrangler pages deploy .
```

### Navigate the Site

- **Main page**: `index.html` or `index.html?page=1`
- **Page 2**: `index.html?page=2`
- **Last page**: `index.html?page=72`
- **Album gallery**: `gallery.html?id=220231397`

## How It Works

### Data Flow

```
Yupoo Website (72 pages)
    ↓ download_pages.py
Downloaded HTML Pages
    ↓ extract_all_albums.py
albums.json (30MB)
    ↓ split_albums.py
albums-data/page-*.json (72 files)
    ↓ create_index.py
albums-index.json
    ↓ update_urls_for_proxy.py
Updated proxy paths
    ↓ Deploy to Cloudflare Pages
Live Mirror Website
```

### Image Proxy System

The Cloudflare Pages function at `functions/api/image/[[path]].js` proxies images from Yupoo's CDN to bypass CORS and hotlinking restrictions.

**URL Format:**
```
Original: https://photo.yupoo.com/rmqc/4c321195/medium.jpg
Proxied:  /api/image/rmqc/4c321195/medium.jpg
```

**Features:**
- Proper `Referer` and `User-Agent` headers
- 1-year cache control for performance
- CORS headers for cross-origin access
- Error handling with appropriate status codes

### Pagination System

The frontend dynamically loads page-specific JSON files based on the `?page=X` URL parameter:

```javascript
fetch(`albums-data/page-${currentPage}.json`)
  .then(response => response.json())
  .then(data => {
    // Display 120 albums for this page
  });
```

**Navigation features:**
- Shows 10 visible page numbers at a time
- Ellipsis shortcuts for quick page jumps
- Previous/Next buttons with disabled states
- Current page highlighting

## Usage Guide

### 1. Initial Setup

Download all album listing pages:
```bash
python3 download_pages.py
```

This will:
- Download all 72 pages from Yupoo
- Save to `pages/page_1.html` through `pages/page_72.html`
- Skip already downloaded pages
- Use 1-second rate limiting

### 2. Extract Album Data

Parse downloaded pages and create albums.json:
```bash
python3 extract_all_albums.py
```

This will:
- Extract all 8,639 albums
- Handle both browser-saved and programmatic HTML formats
- Merge with existing detailed album data
- Create/update `albums.json`

### 3. Split Data for Deployment

Overcome Cloudflare's 25MB limit by splitting into page files:
```bash
python3 split_albums.py
```

Creates 72 files in `albums-data/`:
- `page-1.json`: Albums 1-120
- `page-2.json`: Albums 121-240
- ...
- `page-72.json`: Albums 8521-8639

### 4. Create Lookup Index

Generate lightweight index for gallery viewer:
```bash
python3 create_index.py
```

Creates `albums-index.json` with just IDs, titles, and covers (no full image arrays).

### 5. Update Image URLs for Proxy

Convert direct Yupoo URLs to proxy paths:
```bash
python3 update_urls_for_proxy.py
```

This modifies URLs in `albums-data/` files from:
- `https://photo.yupoo.com/rmqc/xxx/medium.jpg`
- To: `/api/image/rmqc/xxx/medium.jpg`

### 6. Download Individual Albums (Optional)

To get full image galleries for specific albums:

**Single album:**
```bash
python3 download_album.py 220231397
```

**Batch download:**
```bash
python3 download_album.py 220231397 220231398 220231399
```

**Download all albums:**
```bash
python3 download_album.py --all
```

Then re-run `extract_all_albums.py` to merge the new data.

## Data Structure

### albums-data/page-X.json
```json
{
  "page": 1,
  "total_pages": 72,
  "total_albums": 8639,
  "albums": [
    {
      "id": "220231397",
      "title": "8202663",
      "cover": "/api/image/rmqc/4c321195/medium.jpg",
      "images": [
        {
          "small": "/api/image/rmqc/4c321195/small.jpg",
          "big": "/api/image/rmqc/4c321195/big.jpg"
        }
      ]
    }
  ]
}
```

### albums-index.json
```json
{
  "220231397": {
    "id": "220231397",
    "title": "8202663",
    "cover": "/api/image/rmqc/4c321195/medium.jpg"
  }
}
```

## Python Scripts Reference

### download_pages.py
Downloads all listing pages from Yupoo with rate limiting and progress tracking.

**Usage:**
```bash
python3 download_pages.py
```

### extract_all_albums.py
Main extraction engine that parses HTML and creates albums.json.

**Features:**
- Supports browser-saved and programmatic HTML
- Deduplicates across all 72 pages
- Merges with detailed album data
- Idempotent (safe to run multiple times)

**Usage:**
```bash
python3 extract_all_albums.py
```

### split_albums.py
Splits albums.json into 72 page-specific files for deployment.

**Usage:**
```bash
python3 split_albums.py
```

### create_index.py
Generates lightweight lookup index from albums.json.

**Usage:**
```bash
python3 create_index.py
```

### update_urls_for_proxy.py
Converts Yupoo CDN URLs to proxy paths in albums-data/ files.

**Usage:**
```bash
python3 update_urls_for_proxy.py
```

### download_album.py
Downloads individual album pages for detailed galleries.

**Usage:**
```bash
# Single album
python3 download_album.py 220231397

# Multiple albums
python3 download_album.py 220231397 220231398

# All albums (8,639 total)
python3 download_album.py --all
```

## Deployment

### Cloudflare Pages

1. **Install Wrangler:**
```bash
npm install -g wrangler
```

2. **Deploy:**
```bash
wrangler pages deploy .
```

3. **Configure build settings:**
- Build command: (none - static site)
- Build output directory: `.`
- Functions directory: `functions/`

### What Gets Deployed

**Included:**
- `index.html`, `gallery.html`
- `albums-data/` (72 JSON files)
- `albums-index.json`
- `functions/api/image/[[path]].js`
- `wrangler.toml`

**Excluded (via .gitignore):**
- `albums.json` (too large, 30MB)
- `pages/` (source HTML files)
- `rmqc/` (downloaded content)
- `*.py` (Python scripts)

## Statistics

| Metric | Value |
|--------|-------|
| Total Albums | 8,639 |
| Total Pages | 72 |
| Albums per Page | 120 (119 on page 72) |
| Page Files | 72 JSON files (~250KB each) |
| Index File Size | 776KB |
| Total Data Size | ~19MB deployed |
| Original albums.json | 30MB (archived) |
| Downloaded Pages | 9.3MB (local only) |
| Downloaded Content | 551MB (local only) |

## Technical Highlights

- **Efficient Pagination**: JavaScript-based with URL parameter support
- **Smart Data Splitting**: Overcomes 25MB Cloudflare limit
- **Dual Format Support**: Handles different HTML structures
- **Deduplication**: Dictionary-based tracking across pages
- **Image Proxy**: Serverless function with caching and CORS
- **Graceful Degradation**: SVG placeholders for missing images
- **Idempotent Scripts**: Safe to run multiple times
- **Rate Limiting**: Polite web scraping with delays

## Troubleshooting

### Albums show but galleries are empty
**Solution:** The album hasn't been downloaded yet. Use:
```bash
python3 download_album.py ALBUM_ID
python3 extract_all_albums.py
```

### Images don't load locally
**Solution:** Start a web server instead of opening files directly:
```bash
python3 -m http.server 8000
```

### "Page not found" on Cloudflare Pages
**Solution:** Make sure you've run `split_albums.py` and deployed the `albums-data/` folder.

### Image proxy returns 404
**Solution:** Check the URL format. Should be `/api/image/{vendor}/{imageId}/{size}`.

### Need to update the mirror
**Solution:** Re-run the workflow:
```bash
python3 download_pages.py
python3 extract_all_albums.py
python3 split_albums.py
python3 update_urls_for_proxy.py
wrangler pages deploy .
```

## Known Limitations

- Most albums only have cover images (full galleries require individual downloads)
- Images require internet connection (loaded from Yupoo CDN via proxy)
- No search functionality
- No category filtering
- No sorting options

## Future Enhancements

- [ ] Search functionality
- [ ] Category/tag filtering
- [ ] Bulk album download with progress bar
- [ ] Image lazy loading
- [ ] Infinite scroll option
- [ ] Download all images button
- [ ] Dark mode

## License

This is an archival mirror project for personal use. All images and content belong to their respective owners on Yupoo.

## Contributing

This is a personal archival project, but feel free to fork and adapt for your own Yupoo mirrors.

## Acknowledgments

- Original content from https://rmqc.x.yupoo.com/albums
- Hosted on Cloudflare Pages
- Built with vanilla JavaScript (no frameworks)
