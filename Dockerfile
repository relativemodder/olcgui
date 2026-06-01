FROM oven/bun:1-debian

RUN echo "deb http://deb.debian.org/debian trixie main" > /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian-security trixie-security main" >> /etc/apt/sources.list \
    echo "nameserver 8.8.8.8" > /etc/resolv.conf

# Install git and Go (required for olcrtc compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install Mage build tool
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:$PATH
RUN mkdir -p /go/bin /go/src \
    && git config --global http.sslVerify false \
    && git clone https://github.com/magefile/mage /tmp/mage \
    && cd /tmp/mage \
    && go run bootstrap.go \
    && rm -rf /tmp/mage

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .

ENV OLCRTC_DATA_DIR=/app/data/instances
ENV OLCRTC_GIT_DIR=/app/olcrtc
ENV OLCRTC_BUILD_DIR=/app/olcrtc
ENV MAGE_CMD=mage
ENV DATABASE_URL=/app/data/sqlite.db
ENV BODY_SIZE_LIMIT=Infinity

RUN mkdir -p /app/data/instances

RUN bun run build
ENV PORT=5173
EXPOSE 5173

CMD ["bun", "./build/index.js"]
