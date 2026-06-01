FROM oven/bun:1-debian

# Install git and Go (required for olcrtc compilation)
RUN apt-get update && apt-get install -y \
    git \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install Mage build tool
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:$PATH
RUN git clone https://github.com/magefile/mage /tmp/mage \
    && cd /tmp/mage \
    && go run bootstrap.go \
    && rm -rf /tmp/mage

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .

ENV OLCRTC_DATA_DIR=/app/data/instances
ENV OLCRTC_BINARY_PATH=/app/olcrtc/build/olcrtc-linux-amd64
ENV OLCRTC_GIT_DIR=/app/olcrtc
ENV OLCRTC_BUILD_DIR=/app/olcrtc
ENV MAGE_CMD=mage
ENV DATABASE_URL=/app/data/sqlite.db

RUN mkdir -p /app/data/instances

EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
