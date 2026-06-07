# olcgui

Web interface for managing [olcrtc](https://github.com/openlibrecommunity/olcrtc) tunnel instances.

[Читать на русском](README_RU.md)

<img src="/assets/mainpage.png">
<img src="/assets/buildpage.png">

## Stack

- SvelteKit 5
- Bun
- Drizzle ORM
- SQLite
- Tailwind CSS v4

## Deploy on VPS

Download and run the interactive deployer:

```bash
sh <(curl -fsSL https://raw.githubusercontent.com/relativemodder/olcgui/main/get-deployer.sh)
```

If `curl` is not available, use `wget`:

```bash
sh <(wget -qO- https://raw.githubusercontent.com/relativemodder/olcgui/main/get-deployer.sh)
```

The deployer will prompt you for a language, install directory, ports, and registry prefix, then create `compose.yml`, `.env`, `data/`, and `olcrtc/`.

The stack consists of two containers:

- `web` serves the SvelteKit frontend at `http://localhost:5173`
- `api` stays private inside the Compose network and is only accessible through `web`

The `api` container mounts the `olcrtc` repo and database on volumes so data persists across restarts. The `web` container proxies `/api/*` to the internal backend running at `API_BACKEND_URL=http://api:3001`.

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
API_BACKEND_URL=http://localhost:3001
```

Without a `.env`, everything resolves relative to `process.cwd()`, so a standard clone works with no extra configuration.

To compile `olcrtc`, you need Go and [Mage](https://magefile.org/). Use the Builds tab in the UI to start a build.
