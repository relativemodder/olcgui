mod i18n;
mod config;
mod runtime;
mod ui;

use std::path::Path;
use std::thread;
use std::time::Duration;

use colored::*;

fn remaining_container_ids(dir: &Path) -> Option<Vec<String>> {
    runtime::list_project_containers(dir)
        .ok()
        .map(|containers| containers.into_iter().map(|container| container.id).collect())
}

fn wait_for_state(dir: &Path, expected: runtime::State) -> bool {
    for _ in 0..10 {
        if runtime::detect_state(dir) == expected {
            return true;
        }
        thread::sleep(Duration::from_millis(300));
    }
    runtime::detect_state(dir) == expected
}

fn wait_for_no_containers(dir: &Path) -> bool {
    for _ in 0..10 {
        if let Some(ids) = remaining_container_ids(dir)
            && ids.is_empty()
        {
            return true;
        }
        thread::sleep(Duration::from_millis(300));
    }
    matches!(remaining_container_ids(dir), Some(ids) if ids.is_empty())
}

fn try_start_stack(lang: usize, dir: &Path) -> bool {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::no_runtime(lang));
            return false;
        }
    };

    let mut down = tool.cmd.clone();
    down.push("down".to_string());
    runtime::run(&down, dir);

    let mut pull = tool.cmd.clone();
    pull.push("pull".to_string());
    if runtime::run(&pull, dir) != 0 {
        println!("{}", i18n::pull_failed(lang));
    }

    let mut up = tool.cmd.clone();
    up.push("up".to_string());
    up.push("-d".to_string());
    if runtime::run(&up, dir) == 0 && wait_for_state(dir, runtime::State::Running) {
        println!("{}", i18n::stack_started(lang, &tool.cmd.join(" ")));
        return true;
    }

    println!("{}", i18n::stack_failed(lang, &tool.cmd.join(" ")));
    false
}

fn action_status(lang: usize, dir: &Path) {
    println!("{}", i18n::status_title(lang).bold().cyan());
    let state = runtime::detect_state(dir);
    println!("{}: {}", i18n::current_state(lang), ui::state_label(lang, &state));
    if let Ok(containers) = runtime::list_project_containers(dir) {
        for container in containers {
            let name = container.names.join(", ");
            let short_id = container.id.chars().take(12).collect::<String>();
            println!("  {}  {}  {}  {}  {}", name, container.image, container.state, container.status, short_id);
        }
    }
}

fn action_start(lang: usize, dir: &Path) {
    if runtime::detect_state(dir) == runtime::State::Running {
        println!("{}", i18n::already_running(lang));
        return;
    }
    let cfg = match config::read_env(dir) {
        Some(c) => c,
        None => return,
    };
    let busy = runtime::check_ports(&cfg);
    if !busy.is_empty() {
        println!("{}", i18n::ports_busy(lang));
        let ports: Vec<String> = busy.iter().map(|p| p.to_string()).collect();
        println!("{}", ports.join(", "));
        return;
    }
    if !try_start_stack(lang, dir) {
        println!("{}", i18n::start_failed(lang));
    }
}

fn action_stop(lang: usize, dir: &Path) {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::status_runtime_missing(lang));
            return;
        }
    };
    if runtime::detect_state(dir) != runtime::State::Running {
        println!("{}", i18n::already_stopped(lang));
        return;
    }
    let mut args = tool.cmd.clone();
    args.push("down".to_string());
    if runtime::run(&args, dir) != 0 || !wait_for_state(dir, runtime::State::Stopped) {
        println!("{}", i18n::stop_failed(lang));
    }
}

fn action_remove(lang: usize, dir: &Path) {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::status_runtime_missing(lang));
            return;
        }
    };
    let mut args = tool.cmd.clone();
    args.push("down".to_string());
    args.push("--remove-orphans".to_string());
    if runtime::run(&args, dir) != 0 {
        return;
    }
    if wait_for_no_containers(dir) {
        println!("{}", i18n::remove_done(lang));
        return;
    }
    if let Some(ids) = remaining_container_ids(dir)
        && !ids.is_empty()
        && runtime::force_remove_containers(dir, &ids) != 0
    {
        return;
    }
    if !wait_for_no_containers(dir) {
        return;
    }
    println!("{}", i18n::remove_done(lang));
}

fn action_update(lang: usize, dir: &Path) {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::status_runtime_missing(lang));
            return;
        }
    };

    let mut down = tool.cmd.clone();
    down.push("down".to_string());
    runtime::run(&down, dir);

    let mut pull = tool.cmd.clone();
    pull.push("pull".to_string());
    if runtime::run(&pull, dir) != 0 {
        println!("{}", i18n::pull_failed(lang));
    }

    let cfg = match config::read_env(dir) {
        Some(c) => c,
        None => return,
    };
    let busy = runtime::check_ports(&cfg);
    if !busy.is_empty() {
        println!("{}", i18n::ports_busy(lang));
        let ports: Vec<String> = busy.iter().map(|p| p.to_string()).collect();
        println!("{}", ports.join(", "));
        return;
    }

    let mut up = tool.cmd.clone();
    up.push("up".to_string());
    up.push("-d".to_string());
    if runtime::run(&up, dir) != 0 || !wait_for_state(dir, runtime::State::Running) {
        println!("{}", i18n::recreate_failed(lang));
    }
}

fn action_restart(lang: usize, dir: &Path) {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::status_runtime_missing(lang));
            return;
        }
    };

    let mut down = tool.cmd.clone();
    down.push("down".to_string());
    runtime::run(&down, dir);

    let cfg = match config::read_env(dir) {
        Some(c) => c,
        None => return,
    };
    let busy = runtime::check_ports(&cfg);
    if !busy.is_empty() {
        println!("{}", i18n::ports_busy(lang));
        let ports: Vec<String> = busy.iter().map(|p| p.to_string()).collect();
        println!("{}", ports.join(", "));
        return;
    }

    let mut up = tool.cmd.clone();
    up.push("up".to_string());
    up.push("-d".to_string());
    if runtime::run(&up, dir) != 0 || !wait_for_state(dir, runtime::State::Running) {
        println!("{}", i18n::restart_failed(lang));
    }
}

fn action_reconfigure(lang: usize, dir: &Path) {
    println!();
    println!("{}", i18n::reconf_title(lang).bold().cyan());

    let old = config::read_env(dir).unwrap_or_default();
    let selinux_state = if old.selinux { "on" } else { "off" };
    println!("{}", i18n::selinux_detected(lang, selinux_state));

    let web_port = ui::ask_free_web_port(lang, old.web_port);
    let (socks_start, socks_end) = ui::ask_free_port_range(lang, old.socks_start, old.socks_end);
    let image_prefix = ui::ask_image_prefix(lang, &old.image_prefix);
    let selinux = ui::ask_bool(lang, i18n::selinux(lang), old.selinux);

    let cfg = config::Config {
        image_prefix,
        image_tag: old.image_tag,
        web_port,
        socks_start,
        socks_end,
        selinux,
    };

    if let Err(e) = config::write_all(dir, &cfg) {
        eprintln!("Error writing config: {}", e);
        return;
    }

    println!("{}", i18n::reconf_done(lang));
    println!("{}", i18n::stack_written(lang, &config::compose_file_path(dir).display().to_string()));
    println!("{}", i18n::stack_written(lang, &config::env_file_path(dir).display().to_string()));

    if ui::ask_bool(lang, i18n::reconf_restart(lang), true) {
        if runtime::detect_state(dir) == runtime::State::Running {
            action_restart(lang, dir);
        } else {
            action_start(lang, dir);
        }
    }
}

fn action_install(lang: usize, dir: &Path) {
    let web_port = ui::ask_free_web_port(lang, config::DEFAULT_WEB_PORT);
    let (socks_start, socks_end) =
        ui::ask_free_port_range(lang, config::DEFAULT_SOCKS_START, config::DEFAULT_SOCKS_END);
    let image_prefix = ui::ask_image_prefix(lang, config::DEFAULT_IMAGE_PREFIX);
    let selinux = ui::ask_bool(lang, i18n::selinux(lang), true);

    let compose_path = config::compose_file_path(dir);
    let env_path = config::env_file_path(dir);

    if compose_path.exists()
        && !ui::ask_bool(
            lang,
            &i18n::overwrite_compose(lang, &compose_path.display().to_string()),
            false,
        )
    {
        println!("{}", i18n::aborted(lang));
        return;
    }
    if env_path.exists()
        && !ui::ask_bool(
            lang,
            &i18n::overwrite_env(lang, &env_path.display().to_string()),
            false,
        )
    {
        println!("{}", i18n::aborted(lang));
        return;
    }

    let cfg = config::Config {
        image_prefix,
        image_tag: config::DEFAULT_IMAGE_TAG.to_string(),
        web_port,
        socks_start,
        socks_end,
        selinux,
    };

    if let Err(e) = config::write_all(dir, &cfg) {
        eprintln!("Error writing deployment: {}", e);
        return;
    }

    println!();
    println!("{}", i18n::stack_written(lang, &config::compose_file_path(dir).display().to_string()));
    println!("{}", i18n::stack_written(lang, &config::env_file_path(dir).display().to_string()));
    println!("{}", i18n::dir_created(lang, &dir.join("data").display().to_string()));
    println!("{}", i18n::dir_created(lang, &dir.join("olcrtc").display().to_string()));

    if ui::ask_bool(lang, i18n::start_now(lang), true) {
        action_start(lang, dir);
    }
}

fn show_menu_loop(lang: usize, dir: &Path) {
    loop {
        let choice = match ui::show_menu(lang, dir) {
            Some(n) => n,
            None => continue,
        };
        match choice {
            1 => action_status(lang, dir),
            2 => action_start(lang, dir),
            3 => action_update(lang, dir),
            4 => action_reconfigure(lang, dir),
            5 => action_restart(lang, dir),
            6 => action_stop(lang, dir),
            7 => action_remove(lang, dir),
            8 => {
                println!("{}", i18n::done(lang));
                return;
            }
            _ => {}
        }
    }
}

fn main() {
    let lang = ui::choose_language();

    println!("{}", i18n::title(lang).bold().cyan());
    println!();

    let install_dir = ui::ask(i18n::install_dir(lang), Some(config::DEFAULT_INSTALL_DIR));
    let dir = std::path::PathBuf::from(install_dir);
    let dir = if dir.is_relative() {
        std::env::current_dir().unwrap_or_default().join(&dir)
    } else {
        dir
    };

    if config::deployment_exists(&dir) {
        show_menu_loop(lang, &dir);
        return;
    }

    println!("{}", i18n::no_deployment(lang));
    if !ui::ask_bool(lang, i18n::install_now(lang), true) {
        println!("{}", i18n::done(lang));
        return;
    }

    action_install(lang, &dir);
    show_menu_loop(lang, &dir);
}
