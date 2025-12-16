#!/usr/bin/env python3
"""
Download individual album pages from Yupoo.
This script downloads specific album pages to get full image gallery data.
"""

import requests
import time
import json
import sys
from pathlib import Path


def download_album(album_id, output_dir):
    """Download a single album page."""
    url = f"https://rmqc.x.yupoo.com/albums/{album_id}?uid=1"

    print(f"Downloading album {album_id}...")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://rmqc.x.yupoo.com/albums',
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Create album directory
        album_folder = output_dir / str(album_id)
        album_folder.mkdir(exist_ok=True)

        # Save the HTML
        output_path = album_folder / f"album_{album_id}.html"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(response.text)

        print(f"  ✓ Saved to {output_path}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    """Main function."""
    base_dir = Path(__file__).parent
    rmqc_dir = base_dir / 'rmqc'
    rmqc_dir.mkdir(exist_ok=True)

    # Load albums.json to get album IDs
    albums_file = base_dir / 'albums.json'
    if not albums_file.exists():
        print("Error: albums.json not found!")
        return

    with open(albums_file, 'r') as f:
        data = json.load(f)

    albums = data['albums']
    albums_without_images = [a for a in albums if not a.get('images') or len(a.get('images', [])) == 0]

    print(f"Total albums: {len(albums)}")
    print(f"Albums without images: {len(albums_without_images)}")
    print(f"Albums with images: {len(albums) - len(albums_without_images)}")
    print()

    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--help':
            print("Usage:")
            print("  python3 download_album.py <album_id>      Download specific album")
            print("  python3 download_album.py --batch <N>     Download first N albums without images")
            print("  python3 download_album.py --all           Download all albums without images (WARNING: 8600+ albums!)")
            print("  python3 download_album.py --help          Show this help")
            return

        elif sys.argv[1] == '--batch':
            if len(sys.argv) < 3:
                print("Error: Please specify number of albums to download")
                print("Usage: python3 download_album.py --batch <N>")
                return

            try:
                batch_size = int(sys.argv[2])
            except ValueError:
                print("Error: Batch size must be a number")
                return

            print(f"Downloading {batch_size} albums without images...\n")

            successful = 0
            failed = 0

            for i, album in enumerate(albums_without_images[:batch_size], 1):
                print(f"[{i}/{batch_size}]", end=" ")
                if download_album(album['id'], rmqc_dir):
                    successful += 1
                else:
                    failed += 1

                # Rate limiting
                if i < batch_size:
                    time.sleep(1)

            print(f"\n{'='*60}")
            print(f"Batch Download Summary:")
            print(f"  Successful: {successful}")
            print(f"  Failed: {failed}")
            print(f"{'='*60}")
            print("\nNext step: Run 'python3 extract_all_albums.py' to update albums.json")

        elif sys.argv[1] == '--all' or sys.argv[1] == '--force':
            force = sys.argv[1] == '--force' or (len(sys.argv) > 2 and sys.argv[2] == '--force')

            if not force:
                print(f"WARNING: This will download {len(albums_without_images)} album pages!")
                print("This may take a while and consume bandwidth.")
                response = input("Continue? (yes/no): ")

                if response.lower() != 'yes':
                    print("Cancelled.")
                    return

            print(f"\nDownloading all {len(albums_without_images)} albums...\n")

            successful = 0
            failed = 0

            for i, album in enumerate(albums_without_images, 1):
                print(f"[{i}/{len(albums_without_images)}]", end=" ")
                if download_album(album['id'], rmqc_dir):
                    successful += 1
                else:
                    failed += 1

                # Rate limiting
                if i < len(albums_without_images):
                    time.sleep(1)

                # Show progress every 100 albums
                if i % 100 == 0:
                    print(f"\nProgress: {i}/{len(albums_without_images)} albums downloaded\n")

            print(f"\n{'='*60}")
            print(f"Complete Download Summary:")
            print(f"  Successful: {successful}")
            print(f"  Failed: {failed}")
            print(f"{'='*60}")
            print("\nNext step: Run 'python3 extract_all_albums.py' to update albums.json")

        else:
            # Download specific album by ID
            album_id = sys.argv[1]
            if download_album(album_id, rmqc_dir):
                print("\nNext step: Run 'python3 extract_all_albums.py' to update albums.json")

    else:
        print("Download individual albums to get full gallery data.")
        print()
        print("Usage:")
        print("  python3 download_album.py <album_id>      Download specific album")
        print("  python3 download_album.py --batch <N>     Download first N albums without images")
        print("  python3 download_album.py --all           Download all albums without images")
        print("  python3 download_album.py --help          Show this help")
        print()
        print("Examples:")
        print("  python3 download_album.py 220231363       Download album 220231363")
        print("  python3 download_album.py --batch 10      Download first 10 albums")
        print()
        print(f"Showing first 10 albums without images:")
        print()
        for i, album in enumerate(albums_without_images[:10], 1):
            print(f"  {i}. {album['title']} (ID: {album['id']})")


if __name__ == '__main__':
    main()
