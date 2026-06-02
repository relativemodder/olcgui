# olcgui

Веб-интерфейс для управления инстансами туннелей [olcrtc](https://github.com/olcrtc).

<img src="/assets/mainpage.png">
<img src="/assets/buildpage.png">

## Стек

- SvelteKit 5
- Bun
- Drizzle ORM
- SQLite
- Tailwind CSS v4

## Запуск через Docker

**Запуск через Podman Compose:**

Перед запуском (особенно на системах с SELinux, таких как Fedora/Bazzite) необходимо вручную создать папки для монтирования, чтобы избежать проблем с правами доступа:

```bash
mkdir data olcrtc
podman-compose up -d --build
```

**Альтернативный запуск через Podman (без Compose):**

```bash
mkdir data olcrtc
podman build -t olcgui . --no-cache && podman rm -f olcgui && podman run -d --name olcgui -p 5173:5173 -v ./data:/app/data:Z -v ./olcrtc:/app/olcrtc:Z olcgui
```

Репозиторий `olcrtc` и база данных монтируются как volumes, поэтому данные сохраняются между перезапусками контейнера. Интерфейс доступен по адресу `http://localhost:5173`.

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
```

Без `.env` всё разрешается относительно `process.cwd()`, так что после стандартного клона всё работает
без дополнительных настроек.

Для компиляции `olcrtc` нужны Go и [Mage](https://magefile.org/), а запуск сборки доступен во вкладке
"Сборки".
