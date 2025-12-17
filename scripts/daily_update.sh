#!/bin/bash
# Daily update workflow for RMQC mirror site
# This script orchestrates the entire update process

set -e  # Exit on error

# Configuration
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/daily-update-$(date +%Y%m%d-%H%M%S).log"
DATA_DIR="data"
DEPLOY=${DEPLOY:-true}  # Set to false to skip deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$LOG_DIR" "$DATA_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log_error "Update failed: $1"
    exit 1
}

# Main workflow
main() {
    log "=== Starting Daily Update ==="
    log "Log file: $LOG_FILE"

    # Step 1: Check for new albums
    log ""
    log "Step 1: Checking for new albums..."
    if python3 scripts/check_new_albums.py >> "$LOG_FILE" 2>&1; then
        log_success "Album check complete"
    else
        error_exit "Failed to check for new albums"
    fi

    # Check if new albums were found
    if [ ! -f "$DATA_DIR/new_albums.json" ]; then
        log_warning "No new albums detected"
        log_success "Database is already up to date!"
        exit 0
    fi

    NEW_COUNT=$(jq '.count' "$DATA_DIR/new_albums.json" 2>/dev/null || echo "0")

    if [ "$NEW_COUNT" -eq 0 ]; then
        log_warning "No new albums to process"
        log_success "Database is already up to date!"
        exit 0
    fi

    log_success "Found $NEW_COUNT new albums"

    # Step 2: Download new albums
    log ""
    log "Step 2: Downloading $NEW_COUNT new albums..."
    if python3 scripts/download_new_albums.py >> "$LOG_FILE" 2>&1; then
        log_success "Album download complete"
    else
        error_exit "Failed to download new albums"
    fi

    # Step 3: Update data files
    log ""
    log "Step 3: Updating data files..."

    log "  - Splitting albums into page files..."
    if python3 split_albums.py >> "$LOG_FILE" 2>&1; then
        log_success "  Page files updated"
    else
        error_exit "Failed to split albums"
    fi

    log "  - Creating album index..."
    if python3 create_index.py >> "$LOG_FILE" 2>&1; then
        log_success "  Index updated"
    else
        error_exit "Failed to create index"
    fi

    log "  - Updating proxy URLs..."
    if python3 update_urls_for_proxy.py >> "$LOG_FILE" 2>&1; then
        log_success "  Proxy URLs updated"
    else
        error_exit "Failed to update proxy URLs"
    fi

    # Step 4: Deploy updates (optional)
    if [ "$DEPLOY" = true ]; then
        log ""
        log "Step 4: Deploying updates..."
        bash scripts/deploy_updates.sh >> "$LOG_FILE" 2>&1 || error_exit "Deployment failed"
        log_success "Deployment complete"
    else
        log_warning "Deployment skipped (DEPLOY=false)"
    fi

    # Step 5: Generate summary
    log ""
    log "=== Update Summary ==="
    log_success "New albums added: $NEW_COUNT"
    log_success "Data files updated successfully"

    if [ "$DEPLOY" = true ]; then
        log_success "Changes deployed to live site"
        log "Live site: https://zrqc.zrhauls.com/"
    else
        log "To deploy manually, run:"
        log "  bash scripts/deploy_updates.sh"
    fi

    # Archive new_albums.json
    ARCHIVE_FILE="$DATA_DIR/new_albums_$(date +%Y%m%d-%H%M%S).json"
    mv "$DATA_DIR/new_albums.json" "$ARCHIVE_FILE"
    log "Archived new albums list to: $ARCHIVE_FILE"

    log ""
    log_success "Daily update complete!"
}

# Run main workflow
main "$@"
