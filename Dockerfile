FROM oven/bun:1-debian AS deps

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM deps AS web-build

COPY . .

ENV DATABASE_URL=/app/data/sqlite.db \
    OLCRTC_DATA_DIR=/app/data/instances \
    OLCRTC_GIT_DIR=/app/olcrtc \
    OLCRTC_BUILD_DIR=/app/olcrtc \
    MAGE_CMD=mage \
    BODY_SIZE_LIMIT=Infinity

RUN bun run build

FROM oven/bun:1-debian AS web

WORKDIR /app

ENV HOST=0.0.0.0 \
    PORT=5173 \
    API_BACKEND_URL=http://api:3001

COPY --from=web-build /app/package.json ./package.json
COPY --from=web-build /app/node_modules ./node_modules
COPY --from=web-build /app/build ./build

EXPOSE 5173

CMD ["bun", "./build/index.js"]

FROM oven/bun:1-debian AS api

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

ENV GOPATH=/go \
    PATH=/go/bin:$PATH

RUN go install github.com/magefile/mage@latest

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ENV DATABASE_URL=/app/data/sqlite.db \
    OLCRTC_DATA_DIR=/app/data/instances \
    OLCRTC_GIT_DIR=/app/olcrtc \
    OLCRTC_BUILD_DIR=/app/olcrtc \
    OLCRTC_GIT_REMOTE_URL=https://github.com/openlibrecommunity/olcrtc \
    MAGE_CMD=mage \
    BODY_SIZE_LIMIT=Infinity \
    API_HOST=0.0.0.0 \
    API_PORT=3001

RUN mkdir -p /app/data/instances

EXPOSE 3001

CMD ["bun", "--bun", "src/server/api.ts"]
