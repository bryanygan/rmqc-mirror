#!/usr/bin/env python3
"""
Extract album data from all downloaded Yupoo HTML pages.
This script parses multiple pages and creates paginated albums.json files.
"""

import json
import re
import os
from pathlib import Path
from html.parser import HTMLParser


class AlbumParser(HTMLParser):
    """Parse individual album pages to extract image data."""

    def __init__(self):
        super().__init__()
        self.images = []
        self.album_title = None
        self.album_id = None
        self.cover_image = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        # Extract album info from infoCarry div
        if tag == 'div' and attrs_dict.get('id') == 'infoCarry':
            self.album_title = attrs_dict.get('data-name', '')

        # Extract images from img tags with photo.yupoo.com URLs
        if tag == 'img' and 'data-src' in attrs_dict:
            data_src = attrs_dict.get('data-src', '')
            data_origin_src = attrs_dict.get('data-origin-src', '')

            if 'photo.yupoo.com' in data_src:
                # Extract the image ID and small/big URLs
                # data-src format: //photo.yupoo.com/rmqc/[id]/big.jpeg
                # data-origin-src format: //photo.yupoo.com/rmqc/[id]/[filename].jpeg (actual full-size URL)
                match = re.search(r'photo\.yupoo\.com/rmqc/([a-f0-9]+)/', data_src)
                if match:
                    img_id = match.group(1)

                    # Determine file extension
                    ext = '.jpeg' if '.jpeg' in data_src else '.jpg'

                    # Use medium.jpg/jpeg for both thumbnail and full-size view
                    # medium.jpg works with hotlinking (confirmed by working cover images)
                    medium_url = f'https://photo.yupoo.com/rmqc/{img_id}/medium{ext}'

                    self.images.append({
                        'small': medium_url,
                        'big': medium_url
                    })


def extract_album_from_html(html_path):
    """Extract album data from a single album HTML file."""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extract album ID from URL comment
    album_id_match = re.search(r'albums/(\d+)', content)
    album_id = album_id_match.group(1) if album_id_match else None

    # Parse the HTML to extract images and title
    parser = AlbumParser()
    parser.feed(content)

    if album_id:
        parser.album_id = album_id

    # Reverse images array to show in correct order (first to last)
    # The HTML parser extracts images in reverse order from how they should display
    if parser.images:
        parser.images.reverse()

    # Determine cover image (use first image or find medium.jpg)
    cover_image = None
    if parser.images:
        # Try to find a medium.jpg variant for cover
        for img in parser.images:
            img_id = img['small'].split('/')[-2]
            cover_image = f"https://photo.yupoo.com/rmqc/{img_id}/medium.jpg"
            break

    return {
        'id': parser.album_id,
        'title': parser.album_title,
        'cover': cover_image,
        'images': parser.images
    }


def extract_albums_from_listing(html_path):
    """Extract album listing from a single page."""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    albums = []

    # Try two patterns - one for downloaded pages (relative URLs) and one for saved pages (absolute URLs)

    # Pattern 1: For pages downloaded via requests (relative URLs, data-src)
    pattern1 = r'<a\s+class="album__main"\s+title="([^"]*)"\s+href="/albums/(\d+)\?uid=1".*?data-src="([^"]*)"'
    matches1 = re.findall(pattern1, content, re.DOTALL)

    # Pattern 2: For pages saved from browser (absolute URLs, src)
    pattern2 = r'<a class="album__main" title="([^"]*)" href="https://rmqc\.x\.yupoo\.com/albums/(\d+)\?uid=1">.*?<img alt="" data-type="photo" class="album__absolute album__img autocover" src="([^"]*)">'
    matches2 = re.findall(pattern2, content, re.DOTALL)

    # Use whichever pattern found matches
    matches = matches1 if matches1 else matches2

    for title, album_id, cover_src in matches:
        # Normalize the cover URL
        if cover_src.startswith('//'):
            cover_path = 'https:' + cover_src
        elif cover_src.startswith('./'):
            # This is a local file from the downloaded page
            cover_path = 'rmqc/' + cover_src[2:]
        elif cover_src.startswith('http'):
            cover_path = cover_src
        else:
            cover_path = None

        albums.append({
            'id': album_id,
            'title': title,
            'cover': cover_path,
            'images': []
        })

    return albums


def main():
    """Main function to extract all albums from all pages."""
    base_dir = Path(__file__).parent
    pages_dir = base_dir / 'pages'
    rmqc_dir = base_dir / 'rmqc'

    # Dictionary to store all albums by ID
    all_albums = {}

    # First, extract albums from all downloaded listing pages
    print("Extracting albums from listing pages...\n")

    if pages_dir.exists():
        page_files = sorted(pages_dir.glob('page_*.html'), key=lambda x: int(x.stem.split('_')[1]))

        for page_file in page_files:
            page_num = int(page_file.stem.split('_')[1])
            print(f"Processing {page_file.name}...")
            albums = extract_albums_from_listing(page_file)

            for album in albums:
                if album['id'] not in all_albums:
                    all_albums[album['id']] = album

            print(f"  Found {len(albums)} albums on page {page_num}")
    else:
        print("Warning: 'pages' directory not found. Looking for rmqc _ Yupoo.html...")

        # Fallback to old method
        main_html = rmqc_dir / 'rmqc _ Yupoo.html'
        if main_html.exists():
            print(f"Processing {main_html.name}...")
            albums = extract_albums_from_listing(main_html)
            for album in albums:
                if album['id'] not in all_albums:
                    all_albums[album['id']] = album
            print(f"  Found {len(albums)} albums")

    print(f"\nTotal unique albums found: {len(all_albums)}")

    # Now, find detailed album HTML files and update with images
    print("\nProcessing detailed album pages...\n")

    detailed_count = 0
    for album_folder in rmqc_dir.iterdir():
        if album_folder.is_dir() and album_folder.name != '__pycache__':
            for html_file in album_folder.glob('*.html'):
                print(f"Processing {html_file.relative_to(base_dir)}...")
                album_data = extract_album_from_html(html_file)

                if album_data['id'] and album_data['images']:
                    if album_data['id'] in all_albums:
                        all_albums[album_data['id']]['images'] = album_data['images']
                        all_albums[album_data['id']]['cover'] = album_data['cover']
                        all_albums[album_data['id']]['title'] = album_data['title']
                        print(f"  Updated album {album_data['title']} with {len(album_data['images'])} images")
                    else:
                        all_albums[album_data['id']] = album_data
                        print(f"  Added new album {album_data['title']} with {len(album_data['images'])} images")
                    detailed_count += 1
                break

    # Convert to list
    albums_list = list(all_albums.values())

    # Create albums.json
    output = {'albums': albums_list}
    output_path = base_dir / 'albums.json'

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"✓ Created {output_path}")
    print(f"✓ Total albums: {len(albums_list)}")
    print(f"✓ Albums with detailed images: {detailed_count}")
    print(f"✓ Albums with covers only: {len(albums_list) - detailed_count}")
    print(f"{'='*60}")

    # Show sample albums
    print("\nSample albums:")
    for i, album in enumerate(albums_list[:5]):
        image_count = len(album['images'])
        status = f"{image_count} images" if image_count > 0 else "cover only"
        print(f"  {i+1}. {album['title']} (ID: {album['id']}) - {status}")


if __name__ == '__main__':
    main()
