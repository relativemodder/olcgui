# olcgui

Web interface for managing [olcrtc](https://github.com/olcrtc) tunnel instances.

[Читать на русском](README_RU.md)

## Stack

- SvelteKit 5
- Bun
- Drizzle ORM
- SQLite
- Tailwind CSS v4

## Running with Docker

**Running with Podman Compose:**

Before running (especially on systems with SELinux like Fedora/Bazzite), you must manually create the volume directories to avoid permission issues:

```bash
mkdir data olcrtc
podman-compose up -d --build
```

**Alternative using Podman (without Compose):**

```bash
mkdir data olcrtc
podman build -t olcgui . --no-cache && podman rm -f olcgui && podman run -d --name olcgui -p 5173:5173 -v ./data:/app/data:Z -v ./olcrtc:/app/olcrtc:Z olcgui
```

The `olcrtc` repository and database are mounted as volumes so they survive container restarts. App is available at `http://localhost:5173`.

## Local setup

```bash
bun install
bun run dev
```

Copy `.env.example` to `.env` if you need to override any paths:

```env
DATABASE_URL=sqlite.db
OLCRTC_GIT_DIR=./olcrtc
OLCRTC_BUILD_DIR=./olcrtc
OLCRTC_BINARY_PATH=./olcrtc/build/olcrtc-linux-amd64
OLCRTC_DATA_DIR=./data/instances
MAGE_CMD=~/go/bin/mage
```

Without a `.env`, everything defaults to paths relative to `process.cwd()`, so it works out of the box for a standard clone.

To compile `olcrtc`, you need Go and [Mage](https://magefile.org/) use the Builds tab in the UI.
