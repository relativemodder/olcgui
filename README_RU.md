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

## Развёртывание на VPS

Скачайте и запустите интерактивный менеджер деплоя панели:

```bash
sh <(curl -fsSL https://raw.githubusercontent.com/relativemodder/olcgui/main/get-deployer.sh)
./deployer-x86_64-unknown-linux-musl
```

Если `curl` недоступен, используйте `wget`:

```bash
sh <(wget -qO- https://raw.githubusercontent.com/relativemodder/olcgui/main/get-deployer.sh)
./deployer-x86_64-unknown-linux-musl
```

Скрипт скачает последнюю версию бинарника, а деплоер сам спросит язык, директорию установки, порты и префикс registry, после чего создаст `compose.yml`, `.env`, `data/` и `olcrtc/`.

- `web` отдаёт фронтенд SvelteKit по адресу `http://localhost:5173`
- `api` остаётся внутри сети Compose и доступен только через `web`

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
