use std::collections::{HashMap, HashSet};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::path::Path;
use std::process::Command;
use std::time::Duration;

use serde::Deserialize;

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

#[derive(Clone, Copy)]
pub enum ContainerEngine {
    Podman,
    Docker,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ContainerInfo {
    #[serde(rename = "Id")]
    pub id: String,
    #[serde(rename = "Image")]
    pub image: String,
    #[serde(rename = "State")]
    pub state: String,
    #[serde(rename = "Status")]
    pub status: String,
    #[serde(rename = "Names", default)]
    pub names: Vec<String>,
    #[serde(rename = "Labels", default)]
    pub labels: HashMap<String, String>,
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

pub fn find_engine() -> Option<ContainerEngine> {
    if which("podman").is_some() {
        return Some(ContainerEngine::Podman);
    }
    if which("docker").is_some() {
        return Some(ContainerEngine::Docker);
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

fn project_name(dir: &Path) -> Option<String> {
    dir.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.to_string())
}

fn engine_binary(engine: ContainerEngine) -> &'static str {
    match engine {
        ContainerEngine::Podman => "podman",
        ContainerEngine::Docker => "docker",
    }
}

fn parse_container_json(output: &str) -> Option<Vec<ContainerInfo>> {
    if output.trim().is_empty() {
        return Some(Vec::new());
    }

    if let Ok(entries) = serde_json::from_str::<Vec<ContainerInfo>>(output) {
        return Some(entries);
    }

    let mut entries = Vec::new();
    for line in output.lines().map(str::trim).filter(|line| !line.is_empty()) {
        entries.push(serde_json::from_str::<ContainerInfo>(line).ok()?);
    }
    Some(entries)
}

fn run_engine_ps_json(engine: ContainerEngine, label_filter: &str, cwd: &Path) -> Option<Vec<ContainerInfo>> {
    let args = vec![
        engine_binary(engine).to_string(),
        "ps".to_string(),
        "-a".to_string(),
        "--format".to_string(),
        "json".to_string(),
        "--filter".to_string(),
        label_filter.to_string(),
    ];
    let (rc, output) = run_quiet_stdout(&args, cwd);
    if rc != 0 {
        return None;
    }
    parse_container_json(&output)
}

fn same_path(a: &str, b: &Path) -> bool {
    if a == b.to_string_lossy().as_ref() {
        return true;
    }
    let left = Path::new(a).canonicalize().ok();
    let right = b.canonicalize().ok();
    matches!((left, right), (Some(left), Some(right)) if left == right)
}

fn matches_project_container(container: &ContainerInfo, project: &str, dir: &Path) -> bool {
    if let Some(working_dir) = container.labels.get("com.docker.compose.project.working_dir")
        && same_path(working_dir, dir)
    {
        return true;
    }
    let prefix = format!("{project}_");
    container.names.iter().any(|name| name.starts_with(&prefix))
}

pub fn list_project_containers(dir: &Path) -> Result<Vec<ContainerInfo>, ()> {
    let engine = find_engine().ok_or(())?;
    let project = project_name(dir).ok_or(())?;
    let mut containers = Vec::new();
    let mut seen = HashSet::new();

    let filters: &[String] = match engine {
        ContainerEngine::Podman => &[
            format!("label=io.podman.compose.project={project}"),
            format!("label=com.docker.compose.project={project}"),
        ],
        ContainerEngine::Docker => &[format!("label=com.docker.compose.project={project}")],
    };

    let mut any_success = false;
    for filter in filters {
        if let Some(entries) = run_engine_ps_json(engine, filter, dir) {
            any_success = true;
            for entry in entries {
                if !matches_project_container(&entry, &project, dir) {
                    continue;
                }
                if seen.insert(entry.id.clone()) {
                    containers.push(entry);
                }
            }
        }
    }

    if !any_success {
        return Err(());
    }

    Ok(containers)
}

pub fn force_remove_containers(dir: &Path, ids: &[String]) -> i32 {
    if ids.is_empty() {
        return 0;
    }
    let engine = match find_engine() {
        Some(engine) => engine,
        None => return -1,
    };
    let mut args = vec![engine_binary(engine).to_string(), "rm".to_string(), "-f".to_string()];
    args.extend(ids.iter().cloned());
    run(&args, dir)
}

pub fn detect_state(dir: &Path) -> State {
    if !config::deployment_exists(dir) {
        return State::Missing;
    }
    let containers = match list_project_containers(dir) {
        Ok(containers) => containers,
        Err(_) => return State::Missing,
    };

    if containers.iter().any(|container| matches!(container.state.as_str(), "running" | "restarting" | "paused")) {
        return State::Running;
    }

    if !containers.is_empty() {
        return State::Stopped;
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
