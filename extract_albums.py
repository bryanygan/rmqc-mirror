#!/usr/bin/env python3
"""
Extract album data from downloaded Yupoo HTML files.
This script parses the HTML files and creates a structured albums.json file.
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
            if 'photo.yupoo.com' in data_src:
                # Extract the image ID from the URL
                # Format: //photo.yupoo.com/rmqc/[id]/big.jpg
                match = re.search(r'photo\.yupoo\.com/rmqc/([a-f0-9]+)/big\.jpg', data_src)
                if match:
                    img_id = match.group(1)
                    # Add https: prefix
                    self.images.append({
                        'small': f'https://photo.yupoo.com/rmqc/{img_id}/small.jpg',
                        'big': f'https://photo.yupoo.com/rmqc/{img_id}/big.jpg'
                    })


def extract_album_from_html(html_path):
    """Extract album data from a single HTML file."""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extract album ID from URL comment
    # <!-- saved from url=(0047)https://rmqc.x.yupoo.com/albums/220231397?uid=1 -->
    album_id_match = re.search(r'albums/(\d+)', content)
    album_id = album_id_match.group(1) if album_id_match else None

    # Parse the HTML to extract images and title
    parser = AlbumParser()
    parser.feed(content)

    if album_id:
        parser.album_id = album_id

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
    """Extract album listing from the main albums page."""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    albums = []

    # Find all album entries with their cover images
    # We need to extract both the album link and the img src together
    # Pattern matches the album block
    pattern = r'<a class="album__main" title="([^"]*)" href="https://rmqc\.x\.yupoo\.com/albums/(\d+)\?uid=1">.*?<img alt="" data-type="photo" class="album__absolute album__img autocover" src="([^"]*)">'
    matches = re.findall(pattern, content, re.DOTALL)

    for title, album_id, cover_src in matches:
        # Convert local path to relative path from the project root
        # e.g., "./rmqc _ Yupoo_files/medium.jpg" -> "rmqc/rmqc _ Yupoo_files/medium.jpg"
        if cover_src.startswith('./'):
            cover_path = 'rmqc/' + cover_src[2:]
        else:
            cover_path = cover_src

        albums.append({
            'id': album_id,
            'title': title,
            'cover': cover_path,  # Use local path
            'images': []
        })

    return albums


def main():
    """Main function to extract all albums."""
    base_dir = Path(__file__).parent
    rmqc_dir = base_dir / 'rmqc'

    # First, extract all albums from the main listing page
    main_html = rmqc_dir / 'rmqc _ Yupoo.html'
    if main_html.exists():
        print(f"Parsing main albums listing: {main_html}")
        albums_dict = {}
        listing_albums = extract_albums_from_listing(main_html)
        for album in listing_albums:
            albums_dict[album['id']] = album
        print(f"  Found {len(albums_dict)} albums in listing")
    else:
        print("Warning: Main albums listing not found!")
        albums_dict = {}

    # Now, find detailed album HTML files and update with images
    for album_folder in rmqc_dir.iterdir():
        if album_folder.is_dir() and album_folder.name != '__pycache__':
            # This is likely an album folder
            for html_file in album_folder.glob('*.html'):
                print(f"Processing detailed album: {html_file}")
                album_data = extract_album_from_html(html_file)
                if album_data['id'] and album_data['images']:
                    # Update the album in our dictionary
                    if album_data['id'] in albums_dict:
                        albums_dict[album_data['id']]['images'] = album_data['images']
                        albums_dict[album_data['id']]['cover'] = album_data['cover']
                        albums_dict[album_data['id']]['title'] = album_data['title']  # Use detailed title
                        print(f"  Updated album: {album_data['title']} ({album_data['id']}) with {len(album_data['images'])} images")
                    else:
                        # Album not in listing, add it anyway
                        albums_dict[album_data['id']] = album_data
                        print(f"  Added new album: {album_data['title']} ({album_data['id']}) with {len(album_data['images'])} images")
                break  # Only process first HTML in each folder

    # Convert dict to list
    albums = list(albums_dict.values())

    # Create albums.json
    output = {'albums': albums}
    output_path = base_dir / 'albums.json'

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Created {output_path}")
    print(f"✓ Total albums: {len(albums)}")
    for album in albums:
        image_count = len(album['images'])
        status = f"{image_count} images" if image_count > 0 else "no images (download album page to get images)"
        print(f"  - {album['title']} ({album['id']}): {status}")


if __name__ == '__main__':
    main()
