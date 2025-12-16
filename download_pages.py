#!/usr/bin/env python3
"""
Download all pages from the Yupoo albums listing.
This script downloads all 72 pages from https://rmqc.x.yupoo.com/albums
"""

import requests
import time
import os
from pathlib import Path


def download_page(page_num, output_dir):
    """Download a single page from Yupoo."""
    if page_num == 1:
        url = "https://rmqc.x.yupoo.com/albums"
        filename = "page_1.html"
    else:
        url = f"https://rmqc.x.yupoo.com/albums?page={page_num}"
        filename = f"page_{page_num}.html"

    output_path = output_dir / filename

    # Skip if already downloaded
    if output_path.exists():
        print(f"  Page {page_num} already exists, skipping...")
        return True

    print(f"  Downloading page {page_num} from {url}...")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://rmqc.x.yupoo.com/albums',
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Save the HTML
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(response.text)

        print(f"  ✓ Saved page {page_num} to {filename}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error downloading page {page_num}: {e}")
        return False


def main():
    """Main function to download all pages."""
    base_dir = Path(__file__).parent
    pages_dir = base_dir / 'pages'
    pages_dir.mkdir(exist_ok=True)

    print("Downloading all 72 pages from Yupoo...")
    print(f"Output directory: {pages_dir}\n")

    total_pages = 72
    successful = 0
    failed = 0

    for page_num in range(1, total_pages + 1):
        if download_page(page_num, pages_dir):
            successful += 1
        else:
            failed += 1

        # Be polite to the server - wait between requests
        if page_num < total_pages:
            time.sleep(1)  # 1 second delay between requests

    print(f"\n{'='*60}")
    print(f"Download Summary:")
    print(f"  Total pages: {total_pages}")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"{'='*60}")

    if failed > 0:
        print("\n⚠ Some pages failed to download. You can run this script again to retry.")
    else:
        print("\n✓ All pages downloaded successfully!")
        print("  Next step: Run extract_albums.py to extract album data")


if __name__ == '__main__':
    main()
