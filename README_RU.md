# olcgui

Веб-интерфейс для управления инстансами туннелей [olcrtc](https://github.com/openlibrecommunity/olcrtc).

<img src="/assets/mainpage.png">
<img src="/assets/buildpage.png">

## Стек

- SvelteKit 5
- Bun
- Drizzle ORM
- SQLite
- Tailwind CSS v4

## Запуск через Docker

- `web` отдаёт фронтенд SvelteKit по адресу `http://localhost:5173`
- `api` остаётся внутри сети Compose и доступен только через `web`

Перед запуском, особенно на системах с SELinux вроде Fedora/Bazzite, создайте папки для bind-mount:

```bash
mkdir data olcrtc
docker compose up -d --build
```

Если используете Podman:

```bash
mkdir data olcrtc
podman compose up -d --build
```

Контейнер `api` монтирует репозиторий `olcrtc` и базу данных, поэтому данные сохраняются между перезапусками. Контейнер `web` проксирует `/api/*` во внутренний backend через `API_BACKEND_URL=http://api:3001`.

## Локальный запуск

```bash
bun install
bun run dev
```

Если нужно переопределить пути, скопируйте `.env.example` в `.env`:

```env
DATABASE_URL=sqlite.db
OLCRTC_GIT_DIR=./olcrtc
OLCRTC_BUILD_DIR=./olcrtc
OLCRTC_BINARY_PATH=./olcrtc/build/olcrtc-linux-amd64
OLCRTC_DATA_DIR=./data/instances
MAGE_CMD=~/go/bin/mage
API_BACKEND_URL=http://localhost:3001
```

Без `.env` всё разрешается относительно `process.cwd()`, так что после стандартного клона всё работает
без дополнительных настроек.

Для компиляции `olcrtc` нужны Go и [Mage](https://magefile.org/), а запуск сборки доступен во вкладке
"Сборки".
