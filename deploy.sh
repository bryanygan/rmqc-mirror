#!/bin/bash
# Deploy script for mirror website
# This avoids deploying large files that exceed Cloudflare's limits

set -e

echo "🚀 Deploying Mirror Website..."

# Clean and prepare deploy directory
rm -rf /tmp/mirror-deploy
mkdir -p /tmp/mirror-deploy

# Copy necessary files
echo "📦 Copying files..."
cp index.html gallery.html mirror.html m.html wrangler.toml albums-index.json config.json /tmp/mirror-deploy/
cp -r functions /tmp/mirror-deploy/
cp -r albums-data /tmp/mirror-deploy/

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
cd /tmp/mirror-deploy
wrangler pages deploy . --project-name=preorders

echo "✅ Deployment complete!"
