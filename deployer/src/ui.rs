use std::io::{self, BufRead, Write};

use crate::i18n;
use crate::runtime;

pub fn choose_language() -> usize {
    loop {
        print!(
            "{} / {} [en/ru]: ",
            i18n::choose_lang(0),
            i18n::choose_lang(1),
        );
        io::stdout().flush().unwrap();
        let val = read_line().trim().to_lowercase();
        if val == "en" {
            return 0;
        }
        if val == "ru" {
            return 1;
        }
        println!("{} / {}", i18n::language_invalid(0), i18n::language_invalid(1));
    }
}

fn read_line() -> String {
    let stdin = io::stdin();
    let mut line = String::new();
    stdin.lock().read_line(&mut line).unwrap_or_default();
    line
}

pub fn ask(prompt: &str, default: Option<&str>) -> String {
    let suffix = match default {
        Some(d) => format!(" [{}]", d),
        None => String::new(),
    };
    loop {
        print!("{}{}: ", prompt, suffix);
        io::stdout().flush().unwrap();
        let val = read_line().trim().to_string();
        if !val.is_empty() {
            return val;
        }
        if let Some(d) = default {
            return d.to_string();
        }
    }
}

pub fn ask_bool(lang: usize, prompt: &str, default: bool) -> bool {
    let yes_ru = lang == 1;
    let suffix = if default { " [Y/n]" } else { " [y/N]" };
    loop {
        print!("{}{}: ", prompt, suffix);
        io::stdout().flush().unwrap();
        let val = read_line().trim().to_lowercase();
        if val.is_empty() {
            return default;
        }
        let yes = if yes_ru {
            val == "y" || val == "yes" || val == "да" || val == "д"
        } else {
            val == "y" || val == "yes"
        };
        if yes {
            return true;
        }
        let no = if yes_ru {
            val == "n" || val == "no" || val == "нет" || val == "н"
        } else {
            val == "n" || val == "no"
        };
        if no {
            return false;
        }
        println!("{}", i18n::answer_yes_no(lang));
    }
}

pub fn ask_web_port(lang: usize, default: u16) -> u16 {
    loop {
        let val = ask(i18n::web_port(lang), Some(&default.to_string()));
        match val.parse::<u16>() {
            Ok(p) if p >= 1 => return p,
            _ => println!("{}", i18n::port_number(lang)),
        }
    }
}

pub fn ask_free_web_port(lang: usize, default: u16) -> u16 {
    loop {
        let port = ask_web_port(lang, default);
        if !runtime::port_is_free(port) {
            println!("{}", i18n::port_in_use(lang, &port.to_string()));
            continue;
        }
        return port;
    }
}

pub fn ask_port_range(lang: usize, default: &str) -> (u16, u16) {
    loop {
        let val = ask(i18n::socks_range(lang), Some(default));
        let parts: Vec<&str> = val.splitn(2, '-').collect();
        if parts.len() != 2 {
            println!("{}", i18n::port_range_format(lang));
            continue;
        }
        let start: u16 = match parts[0].trim().parse() {
            Ok(n) => n,
            Err(_) => {
                println!("{}", i18n::range_numbers(lang));
                continue;
            }
        };
        let end: u16 = match parts[1].trim().parse() {
            Ok(n) => n,
            Err(_) => {
                println!("{}", i18n::range_numbers(lang));
                continue;
            }
        };
        if start == 0 || end == 0 || start > end {
            println!("{}", i18n::range_bounds(lang));
            continue;
        }
        return (start, end);
    }
}

pub fn ask_free_port_range(lang: usize, default_start: u16, default_end: u16) -> (u16, u16) {
    let default_str = format!("{}-{}", default_start, default_end);
    loop {
        let (start, end) = ask_port_range(lang, &default_str);
        let busy = runtime::ports_in_range_busy(start, end);
        if let Some(p) = busy.first() {
            println!("{}", i18n::port_in_use(lang, &p.to_string()));
            continue;
        }
        return (start, end);
    }
}

pub fn ask_image_prefix(lang: usize, default: &str) -> String {
    loop {
        let mut val = ask(i18n::image_prefix(lang), Some(default));
        val = val.trim_end_matches('/').to_string();
        if val.is_empty() {
            println!("{}", i18n::empty_prefix(lang));
            continue;
        }
        if let Some(last) = val.split('/').next_back()
            && last.contains(':')
        {
            println!("{}", i18n::tag_in_prefix(lang));
            continue;
        }
        return val;
    }
}

pub fn state_label(lang: usize, state: &runtime::State) -> &'static str {
    match state {
        runtime::State::Running => i18n::state_running(lang),
        runtime::State::Stopped => i18n::state_stopped(lang),
        runtime::State::Missing => i18n::state_missing(lang),
    }
}

pub fn show_menu(lang: usize, dir: &std::path::Path) -> Option<usize> {
    let state = runtime::detect_state(dir);
    println!();
    println!("{}", i18n::menu_header(lang));
    println!("{}: {}", i18n::current_state(lang), state_label(lang, &state));
    println!("1. {}", i18n::menu_status(lang));
    println!("2. {}", i18n::menu_start(lang));
    println!("3. {}", i18n::menu_update(lang));
    println!("4. {}", i18n::menu_reconfigure(lang));
    println!("5. {}", i18n::menu_restart(lang));
    println!("6. {}", i18n::menu_stop(lang));
    println!("7. {}", i18n::menu_remove(lang));
    println!("8. {}", i18n::menu_exit(lang));
    loop {
        let choice = ask(i18n::menu_hint(lang), None);
        if let Ok(n) = choice.parse::<usize>()
            && (1..=8).contains(&n)
        {
            return Some(n);
        }
    }
}
