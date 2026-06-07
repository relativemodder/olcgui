use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::path::Path;
use std::process::Command;
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
    find_all_tools().into_iter().next()
}

pub fn find_all_tools() -> Vec<ComposeTool> {
    let candidates: &[&[&str]] = &[
        &["podman-compose"],
        &["podman", "compose"],
        &["docker-compose"],
        &["docker", "compose"],
    ];
    let mut found = Vec::new();
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
            found.push(ComposeTool {
                cmd: base.iter().map(|s| s.to_string()).collect(),
            });
        }
    }
    found
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

fn run_ps_json(tool: &ComposeTool, dir: &Path) -> (i32, String) {
    let mut args = tool.cmd.clone();
    args.push("ps".to_string());
    args.push("--format".to_string());
    args.push("json".to_string());
    let (rc, output) = run_quiet_stdout(&args, dir);
    if rc == 0 {
        return (rc, output);
    }
    let mut args2 = tool.cmd.clone();
    args2.push("ps".to_string());
    args2.push("-f".to_string());
    args2.push("json".to_string());
    run_quiet_stdout(&args2, dir)
}

pub fn detect_state(dir: &Path) -> State {
    if !config::deployment_exists(dir) {
        return State::Missing;
    }
    let tools = find_all_tools();
    if tools.is_empty() {
        return State::Missing;
    }

    for tool in &tools {
        let (rc, output) = run_ps_json(tool, dir);
        if rc != 0 {
            continue;
        }
        if let Ok(entries) = serde_json::from_str::<Vec<serde_json::Value>>(&output) {
            let mut has_any = false;
            for entry in &entries {
                if let Some(state) = entry.get("State").and_then(|v| v.as_str()) {
                    has_any = true;
                    if state == "running" {
                        return State::Running;
                    }
                }
            }
            if has_any {
                return State::Stopped;
            }
        }
    }

    State::Stopped
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
