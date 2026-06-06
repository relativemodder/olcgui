#!/usr/bin/env python3

from __future__ import annotations

import shutil
import subprocess
import socket
import re
from pathlib import Path


DEFAULT_IMAGE_PREFIX = "ghcr.io/relativemodder/olcgui"
DEFAULT_IMAGE_TAG = "latest"
DEFAULT_WEB_PORT = "5173"
DEFAULT_SOCKS_RANGE = "8800-8820"
DEFAULT_INSTALL_DIR = "olcgui"
COMPOSE_FILENAME = "compose.yml"
ENV_FILENAME = ".env"


STRINGS = {
    "en": {
        "title": "olcgui deployment manager",
        "choose_lang": "Please choose a language",
        "install_dir": "Install directory",
        "web_port": "Web port on the host",
        "socks_range": "SOCKS port range on the host",
        "image_prefix": "GHCR image prefix",
        "selinux": "Use SELinux relabeling (:Z) for bind mounts",
        "overwrite_compose": "{path} already exists. Would you like to overwrite it",
        "overwrite_env": "{path} already exists. Would you like to overwrite it",
        "start_now": "Start the stack now",
        "done": "Done.",
        "aborted": "Canceled.",
        "stack_written": "Wrote {path}",
        "dir_created": "Created {path}",
        "no_runtime": "No compose runtime was found. Please install docker, docker-compose, podman, or podman-compose.",
        "stopping": "Stopping any existing stack before updating.",
        "pull_failed": "Pull failed. I will try to start from local images anyway.",
        "stack_started": "Stack started with: {tool}",
        "stack_failed": "Failed with: {tool}",
        "nothing_started": "Nothing was started.",
        "answer_yes_no": "Please answer yes or no.",
        "port_number": "The port must be a number.",
        "port_range_format": "Please use the format start-end, for example 8800-8820.",
        "range_numbers": "The range must contain numbers only.",
        "range_bounds": "The range must stay within 1-65535, and start must not be greater than end.",
        "port_in_use": "Port {port} is already in use. Please choose another value.",
        "empty_prefix": "The image prefix cannot be empty.",
        "tag_in_prefix": "Please do not include a tag in the image prefix.",
        "language_invalid": "Please choose en or ru.",
        "no_deployment": "No deployment was found in this directory.",
        "install_now": "Would you like to create a new deployment now",
        "installed": "Deployment files were created.",
        "current_state": "Current state",
        "state_running": "running",
        "state_stopped": "stopped",
        "state_missing": "missing",
        "menu_header": "Select an action",
        "menu_status": "Show status",
        "menu_install": "Create new deployment",
        "menu_start": "Start deployment",
        "menu_update": "Update deployment",
        "menu_restart": "Restart deployment",
        "menu_stop": "Stop deployment",
        "menu_remove": "Remove containers",
        "menu_exit": "Exit",
        "already_running": "The stack is already running.",
        "already_stopped": "The stack is already stopped.",
        "start_failed": "The deployment could not be started.",
        "recreate_failed": "The deployment could not be updated.",
        "restart_failed": "The deployment could not be restarted.",
        "stop_failed": "The deployment could not be stopped.",
        "remove_done": "Containers were removed.",
        "status_title": "Deployment status",
        "status_runtime_missing": "Runtime is unavailable. Please install docker or podman.",
        "ports_busy": "One or more required ports are already in use.",
        "menu_hint": "Enter a number and press Enter.",
    },
    "ru": {
        "title": "Менеджер деплоя olcgui",
        "choose_lang": "Пожалуйста, выберите язык",
        "install_dir": "Директория установки",
        "web_port": "Порт веб-интерфейса на хосте",
        "socks_range": "Диапазон SOCKS-портов на хосте",
        "image_prefix": "Префикс GHCR-образов",
        "selinux": "Использовать SELinux-relabeling (:Z) для bind-mount",
        "overwrite_compose": "{path} уже существует. Хотите перезаписать его",
        "overwrite_env": "{path} уже существует. Хотите перезаписать его",
        "start_now": "Запустить стек сейчас",
        "done": "Готово.",
        "aborted": "Отменено.",
        "stack_written": "Записан {path}",
        "dir_created": "Создана {path}",
        "no_runtime": "Не найден runtime для compose. Пожалуйста, установите docker, docker-compose, podman или podman-compose.",
        "stopping": "Останавливаю существующий стек перед обновлением.",
        "pull_failed": "Pull не удался. Я попробую запустить стек из локальных образов.",
        "stack_started": "Стек запущен через: {tool}",
        "stack_failed": "Не удалось через: {tool}",
        "nothing_started": "Ничего не было запущено.",
        "answer_yes_no": "Пожалуйста, ответьте yes или no.",
        "port_number": "Порт должен быть числом.",
        "port_range_format": "Пожалуйста, используйте формат start-end, например 8800-8820.",
        "range_numbers": "В диапазоне должны быть только числа.",
        "range_bounds": "Диапазон должен находиться в пределах 1-65535, а start не должен быть больше end.",
        "port_in_use": "Порт {port} уже занят. Пожалуйста, выберите другое значение.",
        "empty_prefix": "Префикс образов не может быть пустым.",
        "tag_in_prefix": "Пожалуйста, не указывайте тег в префиксе образа.",
        "language_invalid": "Пожалуйста, выберите ru или en.",
        "no_deployment": "В этой директории деплой не найден.",
        "install_now": "Хотите создать новый деплой сейчас",
        "installed": "Файлы деплоя созданы.",
        "current_state": "Текущее состояние",
        "state_running": "запущен",
        "state_stopped": "остановлен",
        "state_missing": "отсутствует",
        "menu_header": "Выберите действие",
        "menu_status": "Показать статус",
        "menu_install": "Создать новый деплой",
        "menu_start": "Запустить деплой",
        "menu_update": "Обновить деплой",
        "menu_restart": "Перезапустить деплой",
        "menu_stop": "Остановить деплой",
        "menu_remove": "Удалить контейнеры",
        "menu_exit": "Выход",
        "already_running": "Стек уже запущен.",
        "already_stopped": "Стек уже остановлен.",
        "start_failed": "Не удалось запустить деплой.",
        "recreate_failed": "Не удалось обновить деплой.",
        "restart_failed": "Не удалось перезапустить деплой.",
        "stop_failed": "Не удалось остановить деплой.",
        "remove_done": "Контейнеры удалены.",
        "status_title": "Статус деплоя",
        "status_runtime_missing": "Runtime недоступен. Пожалуйста, установите docker или podman.",
        "ports_busy": "Один или несколько необходимых портов уже заняты.",
        "menu_hint": "Введите номер и нажмите Enter.",
    },
}


def tr(lang: str, key: str, **kwargs: str) -> str:
    return STRINGS[lang][key].format(**kwargs)


def choose_language() -> str:
    while True:
        value = (
            input(
                f"{STRINGS['en']['choose_lang']} / {STRINGS['ru']['choose_lang']} [en/ru]: "
            )
            .strip()
            .lower()
        )
        if value in {"en", "ru"}:
            return value
        print(
            f"{STRINGS['en']['language_invalid']} / {STRINGS['ru']['language_invalid']}"
        )


def ask(lang: str, prompt: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default is not None else ""
    while True:
        value = input(f"{prompt}{suffix}: ").strip()
        if value:
            return value
        if default is not None:
            return default


def ask_bool(lang: str, prompt: str, default: bool = False) -> bool:
    suffix = " [Y/n]" if default else " [y/N]"
    yes_values = {"y", "yes"} | ({"да", "д"} if lang == "ru" else set())
    no_values = {"n", "no"} | ({"нет", "н"} if lang == "ru" else set())
    while True:
        value = input(f"{prompt}{suffix}: ").strip().lower()
        if not value:
            return default
        if value in yes_values:
            return True
        if value in no_values:
            return False
        print(tr(lang, "answer_yes_no"))


def ask_web_port(lang: str, default: str) -> str:
    while True:
        value = ask(lang, tr(lang, "web_port"), default)
        try:
            port = int(value)
        except ValueError:
            print(tr(lang, "port_number"))
            continue
        if 1 <= port <= 65535:
            return str(port)
        print(tr(lang, "range_bounds"))


def ask_port_range(lang: str, default: str) -> str:
    while True:
        value = ask(lang, tr(lang, "socks_range"), default)
        parts = value.split("-", 1)
        if len(parts) != 2:
            print(tr(lang, "port_range_format"))
            continue
        try:
            start = int(parts[0])
            end = int(parts[1])
        except ValueError:
            print(tr(lang, "range_numbers"))
            continue
        if not (1 <= start <= end <= 65535):
            print(tr(lang, "range_bounds"))
            continue
        return f"{start}-{end}"


def ask_image_prefix(lang: str, default: str) -> str:
    while True:
        value = ask(lang, tr(lang, "image_prefix"), default).rstrip("/")
        if not value:
            print(tr(lang, "empty_prefix"))
            continue
        if ":" in value.split("/")[-1]:
            print(tr(lang, "tag_in_prefix"))
            continue
        return value


def read_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def port_is_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return sock.connect_ex(("127.0.0.1", port)) != 0


def ask_free_port(lang: str, prompt_key: str, default: str) -> str:
    while True:
        value = ask(lang, tr(lang, prompt_key), default)
        try:
            port = int(value)
        except ValueError:
            print(tr(lang, "port_number"))
            continue
        if not (1 <= port <= 65535):
            print(tr(lang, "range_bounds"))
            continue
        if not port_is_free(port):
            print(tr(lang, "port_in_use", port=str(port)))
            continue
        return str(port)


def ask_free_port_range(lang: str, default: str) -> str:
    while True:
        value = ask_port_range(lang, default)
        start_str, end_str = value.split("-", 1)
        start = int(start_str)
        end = int(end_str)
        busy = [str(port) for port in range(start, end + 1) if not port_is_free(port)]
        if busy:
            print(tr(lang, "port_in_use", port=busy[0]))
            continue
        return value


def split_range(port_range: str) -> tuple[int, int]:
    start_str, end_str = port_range.split("-", 1)
    return int(start_str), int(end_str)


def ports_in_range_busy(port_range: str) -> list[str]:
    start, end = split_range(port_range)
    return [str(port) for port in range(start, end + 1) if not port_is_free(port)]


def render_compose(selinux: bool) -> str:
    mount_suffix = ":Z" if selinux else ""
    return f"""services:
  api:
    image: ${"{"}IMAGE_PREFIX{"}"}-api:${"{"}IMAGE_TAG{"}"}
    expose:
      - '3001'
    ports:
      - '${"{"}SOCKS_PORT_RANGE{"}"}:${"{"}SOCKS_PORT_RANGE{"}"}'
    volumes:
      - ./data:/app/data{mount_suffix}
      - ./olcrtc:/app/olcrtc{mount_suffix}
    environment:
      DATABASE_URL: /app/data/sqlite.db
      OLCRTC_DATA_DIR: /app/data/instances
      OLCRTC_GIT_DIR: /app/olcrtc
      OLCRTC_BUILD_DIR: /app/olcrtc
      OLCRTC_GIT_REMOTE_URL: https://github.com/openlibrecommunity/olcrtc
      MAGE_CMD: mage
      BODY_SIZE_LIMIT: Infinity
      API_HOST: 0.0.0.0
      API_PORT: 3001
    restart: unless-stopped

  web:
    image: ${"{"}IMAGE_PREFIX{"}"}-web:${"{"}IMAGE_TAG{"}"}
    ports:
      - '${"{"}WEB_PORT{"}"}:5173'
    environment:
      HOST: 0.0.0.0
      PORT: 5173
      API_BACKEND_URL: http://api:3001
    depends_on:
      - api
    restart: unless-stopped
"""


def render_env(
    image_prefix: str, image_tag: str, web_port: str, socks_range: str
) -> str:
    return f"""IMAGE_PREFIX={image_prefix}
IMAGE_TAG={image_tag}
WEB_PORT={web_port}
SOCKS_PORT_RANGE={socks_range}
"""


def run_command(cmd: list[str], cwd: Path) -> int:
    print(f"$ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=str(cwd))
    return proc.returncode


def run_command_quiet(cmd: list[str], cwd: Path) -> int:
    proc = subprocess.run(
        cmd, cwd=str(cwd), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    return proc.returncode


def run_command_capture(cmd: list[str], cwd: Path) -> tuple[int, str]:
    proc = subprocess.run(
        cmd, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    return proc.returncode, proc.stdout


def find_compose_tool() -> list[str] | None:
    candidates = [
        ["docker", "compose"],
        ["docker-compose"],
        ["podman", "compose"],
        ["podman-compose"],
    ]

    for base in candidates:
        binary = base[0]
        if shutil.which(binary) is None:
            continue

        check = base + (["--version"] if binary == "podman-compose" else ["version"])
        try:
            rc = subprocess.run(
                check, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            ).returncode
        except FileNotFoundError:
            continue
        if rc == 0:
            return base
    return None


def compose_cmd(tool: list[str], compose_dir: Path, args: list[str]) -> list[str]:
    return tool + args


def compose_file_path(compose_dir: Path) -> Path:
    return compose_dir / COMPOSE_FILENAME


def env_file_path(compose_dir: Path) -> Path:
    return compose_dir / ENV_FILENAME


def deployment_exists(compose_dir: Path) -> bool:
    return compose_file_path(compose_dir).exists()


def deployment_state(compose_dir: Path) -> str:
    if not deployment_exists(compose_dir):
        return "missing"
    tool = find_compose_tool()
    if tool is None:
        return "missing"
    rc, output = run_command_capture(
        compose_cmd(tool, compose_dir, ["ps", "-q"]), compose_dir
    )
    if rc != 0:
        return "missing"
    ids = [
        line.strip()
        for line in output.splitlines()
        if re.fullmatch(r"[0-9a-f]{12,64}", line.strip())
    ]
    return "running" if ids else "stopped"


def required_ports_from_env(compose_dir: Path) -> tuple[str, str] | None:
    env = read_env_file(env_file_path(compose_dir))
    web_port = env.get("WEB_PORT")
    socks_range = env.get("SOCKS_PORT_RANGE")
    if not web_port or not socks_range:
        return None
    return web_port, socks_range


def check_ports_for_deployment(compose_dir: Path, lang: str) -> bool:
    ports = required_ports_from_env(compose_dir)
    if ports is None:
        return True

    web_port, socks_range = ports
    busy_ports: list[str] = []

    try:
        if not port_is_free(int(web_port)):
            busy_ports.append(web_port)
    except ValueError:
        pass

    busy_ports.extend(ports_in_range_busy(socks_range))
    if busy_ports:
        print(tr(lang, "ports_busy"))
        print(", ".join(busy_ports))
        return False
    return True


def try_start_stack(compose_dir: Path) -> bool:
    tool = find_compose_tool()
    if tool is None:
        print(tr(LANG, "no_runtime"))
        return False

    print(tr(LANG, "stopping"))
    down_cmd = tool + ["down"]
    run_command_quiet(down_cmd, compose_dir)

    pull_cmd = tool + ["pull"]
    up_cmd = tool + ["up", "-d"]

    pull_rc = run_command(pull_cmd, compose_dir)
    if pull_rc != 0:
        print(tr(LANG, "pull_failed"))

    up_rc = run_command(up_cmd, compose_dir)
    if up_rc == 0:
        print(tr(LANG, "stack_started", tool=" ".join(tool)))
        return True

    print(tr(LANG, "stack_failed", tool=" ".join(tool)))
    return False


def write_deployment_files(
    compose_dir: Path, image_prefix: str, web_port: str, socks_range: str, selinux: bool
) -> None:
    compose_dir.mkdir(parents=True, exist_ok=True)
    compose_file_path(compose_dir).write_text(render_compose(selinux), encoding="utf-8")
    env_file_path(compose_dir).write_text(
        render_env(image_prefix, DEFAULT_IMAGE_TAG, web_port, socks_range),
        encoding="utf-8",
    )


def ensure_data_dirs(compose_dir: Path) -> None:
    (compose_dir / "data").mkdir(parents=True, exist_ok=True)
    (compose_dir / "olcrtc").mkdir(parents=True, exist_ok=True)


def create_new_deployment(
    lang: str,
    compose_dir: Path,
    web_port: str,
    socks_range: str,
    image_prefix: str,
    selinux: bool,
) -> bool:
    ensure_data_dirs(compose_dir)
    write_deployment_files(compose_dir, image_prefix, web_port, socks_range, selinux)

    print("")
    print(tr(lang, "stack_written", path=str(compose_file_path(compose_dir))))
    print(tr(lang, "stack_written", path=str(env_file_path(compose_dir))))
    print(tr(lang, "dir_created", path=str(compose_dir / "data")))
    print(tr(lang, "dir_created", path=str(compose_dir / "olcrtc")))
    return True


def deployment_kind(compose_dir: Path) -> str:
    if not deployment_exists(compose_dir):
        return "missing"
    state = deployment_state(compose_dir)
    return state


def action_start(lang: str, compose_dir: Path) -> None:
    if deployment_state(compose_dir) == "running":
        print(tr(lang, "already_running"))
        return
    if not check_ports_for_deployment(compose_dir, lang):
        return
    if not try_start_stack(compose_dir):
        print(tr(lang, "start_failed"))


def action_stop(lang: str, compose_dir: Path) -> None:
    tool = find_compose_tool()
    if tool is None:
        print(tr(lang, "status_runtime_missing"))
        return
    if deployment_state(compose_dir) != "running":
        print(tr(lang, "already_stopped"))
        return
    rc = run_command(tool + ["stop"], compose_dir)
    if rc != 0:
        print(tr(lang, "stop_failed"))


def action_remove(lang: str, compose_dir: Path) -> None:
    tool = find_compose_tool()
    if tool is None:
        print(tr(lang, "status_runtime_missing"))
        return
    run_command_quiet(tool + ["down", "--remove-orphans"], compose_dir)
    print(tr(lang, "remove_done"))


def action_update(lang: str, compose_dir: Path) -> None:
    tool = find_compose_tool()
    if tool is None:
        print(tr(lang, "status_runtime_missing"))
        return
    run_command_quiet(tool + ["down"], compose_dir)
    if run_command(tool + ["pull"], compose_dir) != 0:
        print(tr(lang, "pull_failed"))
    if not check_ports_for_deployment(compose_dir, lang):
        return
    if run_command(tool + ["up", "-d"], compose_dir) != 0:
        print(tr(lang, "recreate_failed"))


def action_restart(lang: str, compose_dir: Path) -> None:
    tool = find_compose_tool()
    if tool is None:
        print(tr(lang, "status_runtime_missing"))
        return
    run_command_quiet(tool + ["stop"], compose_dir)
    if not check_ports_for_deployment(compose_dir, lang):
        return
    if run_command(tool + ["up", "-d"], compose_dir) != 0:
        print(tr(lang, "restart_failed"))


def action_status(lang: str, compose_dir: Path) -> None:
    print(tr(lang, "status_title"))
    state = deployment_state(compose_dir)
    print(f"{tr(lang, 'current_state')}: {tr(lang, f'state_{state}')}")
    tool = find_compose_tool()
    if tool is None or state == "missing":
        return
    run_command(tool + ["ps"], compose_dir)


def show_menu(lang: str, compose_dir: Path) -> None:
    while True:
        print("")
        print(tr(lang, "menu_header"))
        print(
            f"{tr(lang, 'current_state')}: {tr(lang, f'state_{deployment_kind(compose_dir)}')}"
        )
        print(f"1. {tr(lang, 'menu_status')}")
        print(f"2. {tr(lang, 'menu_start')}")
        print(f"3. {tr(lang, 'menu_update')}")
        print(f"4. {tr(lang, 'menu_restart')}")
        print(f"5. {tr(lang, 'menu_stop')}")
        print(f"6. {tr(lang, 'menu_remove')}")
        print(f"7. {tr(lang, 'menu_exit')}")
        choice = input(f"{tr(lang, 'menu_hint')}: ").strip()

        if choice == "1":
            action_status(lang, compose_dir)
        elif choice == "2":
            action_start(lang, compose_dir)
        elif choice == "3":
            action_update(lang, compose_dir)
        elif choice == "4":
            action_restart(lang, compose_dir)
        elif choice == "5":
            action_stop(lang, compose_dir)
        elif choice == "6":
            action_remove(lang, compose_dir)
        elif choice == "7":
            return


LANG = "en"


def main() -> int:
    global LANG
    LANG = choose_language()

    print(tr(LANG, "title"))
    print("")

    install_dir = (
        Path(ask(LANG, tr(LANG, "install_dir"), DEFAULT_INSTALL_DIR))
        .expanduser()
        .resolve()
    )
    compose_dir = install_dir
    compose_path = compose_dir / "compose.yml"
    env_path = compose_dir / ".env"
    if deployment_exists(compose_dir):
        show_menu(LANG, compose_dir)
        return 0

    print(tr(LANG, "no_deployment"))
    if not ask_bool(LANG, tr(LANG, "install_now"), True):
        print(tr(LANG, "done"))
        return 0

    web_port = ask_free_port(LANG, "web_port", DEFAULT_WEB_PORT)
    socks_range = ask_free_port_range(LANG, DEFAULT_SOCKS_RANGE)
    image_prefix = ask_image_prefix(LANG, DEFAULT_IMAGE_PREFIX)
    selinux = ask_bool(LANG, tr(LANG, "selinux"), True)

    if compose_path.exists() and not ask_bool(
        LANG, tr(LANG, "overwrite_compose", path=str(compose_path)), False
    ):
        print(tr(LANG, "aborted"))
        return 1
    if env_path.exists() and not ask_bool(
        LANG, tr(LANG, "overwrite_env", path=str(env_path)), False
    ):
        print(tr(LANG, "aborted"))
        return 1

    create_new_deployment(
        LANG, compose_dir, web_port, socks_range, image_prefix, selinux
    )
    if ask_bool(LANG, tr(LANG, "start_now"), True):
        action_start(LANG, compose_dir)

    show_menu(LANG, compose_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
