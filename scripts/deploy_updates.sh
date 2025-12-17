#!/bin/bash
# Deploy updates to Cloudflare Pages
# Can use git-based deployment or direct wrangler deployment

set -e

# Configuration
DEPLOY_METHOD=${DEPLOY_METHOD:-"wrangler"}  # "wrangler" or "git"
COMMIT_MESSAGE=${COMMIT_MESSAGE:-"Daily update: $(date +%Y-%m-%d)"}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check for changes
if [ "$DEPLOY_METHOD" = "git" ]; then
    log "Checking for changes..."

    if git diff --quiet albums-data/ albums-index.json 2>/dev/null; then
        log "No changes to deploy"
        exit 0
    fi
fi

# Deploy based on method
if [ "$DEPLOY_METHOD" = "wrangler" ]; then
    log "Deploying via Wrangler..."

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler not found. Install with: npm install -g wrangler"
        exit 1
    fi

    # Deploy
    wrangler pages deploy . --project-name=preorders

    log_success "Deployed to Cloudflare Pages via Wrangler"

elif [ "$DEPLOY_METHOD" = "git" ]; then
    log "Deploying via Git push..."

    # Configure git if needed
    if [ -z "$(git config user.email)" ]; then
        git config user.email "updates@mirror.local"
        git config user.name "Mirror Update Bot"
    fi

    # Add changes
    log "Staging changes..."
    git add albums-data/ albums-index.json

    # Commit
    log "Committing changes..."
    git commit -m "$COMMIT_MESSAGE" || {
        log "No changes to commit"
        exit 0
    }

    # Push
    log "Pushing to remote..."
    git push origin main

    log_success "Pushed to Git (Cloudflare Pages will auto-deploy)"

else
    log_error "Invalid DEPLOY_METHOD: $DEPLOY_METHOD"
    log "Use 'wrangler' or 'git'"
    exit 1
fi

log_success "Deployment complete!"
log "Live site: https://zrqc.zrhauls.com/"
