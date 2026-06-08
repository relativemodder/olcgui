use std::path::Path;

pub const COMPOSE_FILENAME: &str = "compose.yml";
pub const ENV_FILENAME: &str = ".env";
pub const DEFAULT_INSTALL_DIR: &str = "olcgui";
pub const DEFAULT_IMAGE_PREFIX: &str = "ghcr.io/relativemodder/olcgui";
pub const DEFAULT_IMAGE_TAG: &str = "latest";
pub const DEFAULT_WEB_PORT: u16 = 5173;
pub const DEFAULT_SOCKS_START: u16 = 8800;
pub const DEFAULT_SOCKS_END: u16 = 8820;

#[derive(Clone)]
pub struct Config {
    pub image_prefix: String,
    pub image_tag: String,
    pub web_port: u16,
    pub socks_start: u16,
    pub socks_end: u16,
    pub selinux: bool,
    pub vk_token: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            image_prefix: DEFAULT_IMAGE_PREFIX.to_string(),
            image_tag: DEFAULT_IMAGE_TAG.to_string(),
            web_port: DEFAULT_WEB_PORT,
            socks_start: DEFAULT_SOCKS_START,
            socks_end: DEFAULT_SOCKS_END,
            selinux: true,
            vk_token: None,
        }
    }
}

impl Config {
    pub fn socks_range(&self) -> String {
        format!("{}-{}", self.socks_start, self.socks_end)
    }
}

pub fn compose_file_path(dir: &Path) -> std::path::PathBuf {
    dir.join(COMPOSE_FILENAME)
}

pub fn env_file_path(dir: &Path) -> std::path::PathBuf {
    dir.join(ENV_FILENAME)
}

pub fn deployment_exists(dir: &Path) -> bool {
    compose_file_path(dir).exists()
}

pub fn read_env(dir: &Path) -> Option<Config> {
    let path = env_file_path(dir);
    if !path.exists() {
        return None;
    }
    let text = std::fs::read_to_string(path).ok()?;
    let mut prefix = None;
    let mut tag = None;
    let mut web = None;
    let mut socks = None;
    let mut vk_token = None;
    for raw in text.lines() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let (key, value) = line.split_once('=')?;
        match key.trim() {
            "IMAGE_PREFIX" => prefix = Some(value.trim().to_string()),
            "IMAGE_TAG" => tag = Some(value.trim().to_string()),
            "WEB_PORT" => web = value.trim().parse::<u16>().ok(),
            "SOCKS_PORT_RANGE" => {
                let parts: Vec<&str> = value.trim().splitn(2, '-').collect();
                if parts.len() == 2 {
                    let start = parts[0].trim().parse::<u16>().ok()?;
                    let end = parts[1].trim().parse::<u16>().ok()?;
                    socks = Some((start, end));
                }
            }
            "VK_TOKEN" => {
                let v = value.trim().to_string();
                if !v.is_empty() {
                    vk_token = Some(v);
                }
            }
            _ => {}
        }
    }
    let selinux = read_selinux_from_compose(dir);
    Some(Config {
        image_prefix: prefix?,
        image_tag: tag.unwrap_or_else(|| DEFAULT_IMAGE_TAG.to_string()),
        web_port: web?,
        socks_start: socks?.0,
        socks_end: socks?.1,
        selinux,
        vk_token,
    })
}

pub fn read_selinux_from_compose(dir: &Path) -> bool {
    let path = compose_file_path(dir);
    let text = match std::fs::read_to_string(path) {
        Ok(t) => t,
        Err(_) => return true,
    };
    text.contains(":Z")
}

pub fn render_compose(cfg: &Config) -> String {
    let mount_suffix = if cfg.selinux { ":Z" } else { "" };
    let mut out = format!(
        r#"services:
  api:
    image: ${{IMAGE_PREFIX}}-api:${{IMAGE_TAG}}
    expose:
      - '3001'
    ports:
      - '${{SOCKS_PORT_RANGE}}:${{SOCKS_PORT_RANGE}}'
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
      VK_BOT_URL: http://vk-bot:3002
    restart: unless-stopped

  web:
    image: ${{IMAGE_PREFIX}}-web:${{IMAGE_TAG}}
    ports:
      - '${{WEB_PORT}}:5173'
    environment:
      HOST: 0.0.0.0
      PORT: 5173
      API_BACKEND_URL: http://api:3001
      BODY_SIZE_LIMIT: Infinity
    depends_on:
      - api
    restart: unless-stopped
"#,
    );

    if let Some(token) = &cfg.vk_token {
        out.push_str(&format!(
            r#"
  vk-bot:
    image: ${{IMAGE_PREFIX}}-vk-bot:${{IMAGE_TAG}}
    environment:
      VK_TOKEN: {token}
      API_BACKEND_URL: http://api:3001
      BOT_HTTP_PORT: "3002"
    depends_on:
      - api
    restart: unless-stopped
"#,
        ));
    }

    out
}

pub fn render_env(cfg: &Config) -> String {
    let mut out = format!(
        "IMAGE_PREFIX={}\nIMAGE_TAG={}\nWEB_PORT={}\nSOCKS_PORT_RANGE={}",
        cfg.image_prefix, cfg.image_tag, cfg.web_port, cfg.socks_range()
    );
    if let Some(token) = &cfg.vk_token {
        out.push_str(&format!("\nVK_TOKEN={}", token));
    }
    out.push('\n');
    out
}

pub fn write_all(dir: &Path, cfg: &Config) -> std::io::Result<()> {
    std::fs::create_dir_all(dir)?;
    std::fs::write(compose_file_path(dir), render_compose(cfg))?;
    std::fs::write(env_file_path(dir), render_env(cfg))?;
    std::fs::create_dir_all(dir.join("data"))?;
    std::fs::create_dir_all(dir.join("olcrtc"))?;
    Ok(())
}
