#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*"; exit 1; }

for cmd in podman podman-compose; do
    command -v "$cmd" &>/dev/null || error "'$cmd' not found, install it first"
done

info "creating runtime dirs"
mkdir -p data/instances
mkdir -p olcrtc
mkdir -p .gopath/bin

info "building images..."
podman-compose -f compose.dev.yml build --no-cache

info "extracting mage binary from image into .gopath/bin..."
podman run --rm --entrypoint sh localhost/olcgui_api:latest -c 'cat /go/bin/mage' > .gopath/bin/mage
chmod +x .gopath/bin/mage
info "mage $(.gopath/bin/mage --version 2>&1 | head -1)"

info "installing bun dependencies..."
podman run --rm \
    --userns=keep-id \
    -v "$(pwd):/app:z" \
    -w /app \
    localhost/olcgui_web:latest \
    bun install

info "Done."
info "Usage: podman-compose -f compose.dev.yml up -d"
