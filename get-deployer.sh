#!/bin/sh
set -e
REPO="relativemodder/olcgui"
BIN="deployer-x86_64-unknown-linux-musl"
if command -v curl >/dev/null 2>&1; then
    D="curl -fsSL"
elif command -v wget >/dev/null 2>&1; then
    D="wget -qO-"
else
    echo "curl or wget required" >&2; exit 1
fi
TAG=$($D "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p')
echo "Downloading Deployer..."
$D "https://github.com/$REPO/releases/download/$TAG/$BIN" > "$BIN"
chmod +x "$BIN"
exec "./$BIN"
