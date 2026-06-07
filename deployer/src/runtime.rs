use std::path::Path;
use std::process::Command;
use std::net::{TcpStream, SocketAddr, IpAddr, Ipv4Addr};
use std::time::Duration;

use crate::config;

#[derive(Clone, PartialEq)]
pub enum State {
    Missing,
    Stopped,
    Running,
}

pub struct ComposeTool {
    pub cmd: Vec<String>,
}

pub fn find_tool() -> Option<ComposeTool> {
    let candidates: &[&[&str]] = &[
        &["docker", "compose"],
        &["docker-compose"],
        &["podman", "compose"],
        &["podman-compose"],
    ];
    for base in candidates {
        let binary = base[0];
        if which(binary).is_none() {
            continue;
        }
        let version_flag = if binary == "podman-compose" {
            "--version"
        } else {
            "version"
        };
        let mut check: Vec<String> = base.iter().map(|s| s.to_string()).collect();
        check.push(version_flag.to_string());
        let rc = run_quiet(&check);
        if rc == 0 {
            return Some(ComposeTool {
                cmd: base.iter().map(|s| s.to_string()).collect(),
            });
        }
    }
    None
}

fn which(binary: &str) -> Option<std::path::PathBuf> {
    std::env::var_os("PATH").and_then(|paths| {
        for dir in std::env::split_paths(&paths) {
            let full = dir.join(binary);
            if full.is_file() {
                return Some(full);
            }
        }
        None
    })
}

pub fn run(cmd: &[String], cwd: &Path) -> i32 {
    println!("$ {}", cmd.join(" "));
    let first = &cmd[0];
    let mut c = Command::new(first);
    c.args(&cmd[1..]).current_dir(cwd);
    match c.status() {
        Ok(status) => status.code().unwrap_or(-1),
        Err(_) => -1,
    }
}

pub fn run_quiet(cmd: &[String]) -> i32 {
    run_quiet_cwd(cmd, &std::env::current_dir().unwrap_or_default())
}

pub fn run_quiet_cwd(cmd: &[String], cwd: &Path) -> i32 {
    let first = &cmd[0];
    let mut c = Command::new(first);
    c.args(&cmd[1..])
        .current_dir(cwd)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());
    match c.status() {
        Ok(status) => status.code().unwrap_or(-1),
        Err(_) => -1,
    }
}

pub fn run_quiet_stdout(cmd: &[String], cwd: &Path) -> (i32, String) {
    let first = &cmd[0];
    let mut c = Command::new(first);
    c.args(&cmd[1..])
        .current_dir(cwd)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null());
    match c.output() {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            (out.status.code().unwrap_or(-1), stdout)
        }
        Err(_) => (-1, String::new()),
    }
}

pub fn detect_state(dir: &Path) -> State {
    if !config::deployment_exists(dir) {
        return State::Missing;
    }
    let tool = match find_tool() {
        Some(t) => t,
        None => return State::Missing,
    };
    let mut args = tool.cmd.clone();
    args.push("ps".to_string());
    args.push("-q".to_string());
    let (rc, output) = run_quiet_stdout(&args, dir);
    if rc != 0 {
        return State::Missing;
    }
    let has_ids = output.lines().any(|line| {
        let trimmed = line.trim();
        !trimmed.is_empty() && trimmed.chars().all(|c| c.is_ascii_hexdigit())
    });
    if has_ids { State::Running } else { State::Stopped }
}

pub fn port_is_free(port: u16) -> bool {
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), port);
    TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_err()
}

pub fn ports_in_range_busy(start: u16, end: u16) -> Vec<u16> {
    (start..=end).filter(|p| !port_is_free(*p)).collect()
}

pub fn check_ports(cfg: &config::Config) -> Vec<u16> {
    let mut busy = Vec::new();
    if !port_is_free(cfg.web_port) {
        busy.push(cfg.web_port);
    }
    busy.extend(ports_in_range_busy(cfg.socks_start, cfg.socks_end));
    busy
}
