# Настройка дев окружения

Дев окружение работает через Podman. Рут не нужен.

## Требования к хосту

- `podman`
- `podman-compose`

## Первый запуск

```bash
./dev-setup.sh
```

Скрипт сам скажет, как поднять компоуз.

Он:

1. Создаёт новые директории `data/instances`, `olcrtc`, `.gopath/bin`;
2. Собирает образы микросервисов;
3. Извлекает бинарник `mage` из образа в `.gopath/bin`;
4. Запускает `bun install`, чтобы поставить зависимости.

## Пересборка образов (при изменении любого файла, который описывает контейнеры)

```bash
podman-compose -f compose.dev.yml down
podman rmi localhost/olcgui_api:latest localhost/olcgui_web:latest
./dev-setup.sh
podman-compose -f compose.dev.yml up -d
```

## Полная очистка

Из-за костыльности Go файлы в `.gopath/pkg/mod` находятся в режиме read-only, поэтому перед полным удалением контейнер всё ещё нужен, чтобы исправить флаги:

```bash
podman-compose -f compose.dev.yml down
podman run --rm --userns=keep-id -v "$(pwd):/app:z" oven/bun:1-debian \
    sh -c 'chmod -R u+w /app/.gopath && rm -rf /app/.gopath'
rm -rf node_modules data olcrtc .svelte-kit
podman rmi localhost/olcgui_api:latest localhost/olcgui_web:latest
```
