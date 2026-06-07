mod i18n;
mod config;
mod runtime;
mod ui;

use std::path::Path;

fn try_start_stack(lang: usize, dir: &Path) -> bool {
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => {
            println!("{}", i18n::no_runtime(lang));
            return false;
        }
    };

    println!("{}", i18n::stopping(lang));
    let mut down = tool.cmd.clone();
    down.push("down".to_string());
    runtime::run_quiet_cwd(&down, dir);

    let mut pull = tool.cmd.clone();
    pull.push("pull".to_string());
    if runtime::run(&pull, dir) != 0 {
        println!("{}", i18n::pull_failed(lang));
    }

    let mut up = tool.cmd.clone();
    up.push("up".to_string());
    up.push("-d".to_string());
    if runtime::run(&up, dir) == 0 {
        println!("{}", i18n::stack_started(lang, &tool.cmd.join(" ")));
        return true;
    }

    println!("{}", i18n::stack_failed(lang, &tool.cmd.join(" ")));
    false
}

fn action_status(lang: usize, dir: &Path) {
    println!("{}", i18n::status_title(lang));
    let state = runtime::detect_state(dir);
    println!("{}: {}", i18n::current_state(lang), ui::state_label(lang, &state));
    let tool = match runtime::find_tool() {
        Some(t) => t,
        None => return,
    };
    if state == runtime::State::Missing {
        return;
    }
    let mut args = tool.cmd.clone();
    args.push("ps".to_string());
    runtime::run(&args, dir);
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
    args.push("stop".to_string());
    if runtime::run(&args, dir) != 0 {
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
    runtime::run_quiet_cwd(&args, dir);
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
    runtime::run_quiet_cwd(&down, dir);

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
    if runtime::run(&up, dir) != 0 {
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

    let mut stop = tool.cmd.clone();
    stop.push("stop".to_string());
    runtime::run_quiet_cwd(&stop, dir);

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
    if runtime::run(&up, dir) != 0 {
        println!("{}", i18n::restart_failed(lang));
    }
}

fn action_reconfigure(lang: usize, dir: &Path) {
    println!();
    println!("{}", i18n::reconf_title(lang));

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

    println!("{}", i18n::title(lang));
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
