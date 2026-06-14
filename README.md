# 🔬 IRA-RESEARCHER — Browser Automation MCP Server

> **MCP browser server** for Claude, Cursor, Copilot, OpenCode, and any MCP-compatible AI tool.
> **40 tools**, ghost panel, stealth mode, full DevTools access. No API keys needed.

> **Powered by [Neural Nexus Tech](https://neuralnexustech.com/)**

**Tags:** `mcp server` `mcp browser` `browser automation` `puppeteer mcp` `claude browser` `cursor mcp` `ai agent browser` `mcp tools` `headless browser` `web scraping mcp` `devtools mcp` `ghost panel`

## ✨ What is this?

IRA-RESEARCHER is an **MCP (Model Context Protocol) server** that gives AI assistants full control of a Chrome browser. It works with **Claude Desktop, Claude Code, Cursor, VS Code Copilot, OpenCode, Windsurf, Aider, Cline**, and any tool that supports MCP.

- **40 tools** — navigate, click, type, screenshot, read pages, inspect elements, run JavaScript, intercept requests, and more
- **👻 Ghost panel** — real-time overlay showing every action in the browser
- **🛡️ Stealth mode** — anti-detection evasions to avoid bot blocks
- **🔧 Full DevTools** — console, network, performance, storage, accessibility audit
- **🏃 Auto browser launch** — opens Chrome automatically, no extension needed
- **🔑 Zero API keys** — runs locally, no cloud dependency

## 📋 Quick Start (2 steps)

### Option A: Run from npm (easiest)

```powershell
npm install -g ira-researcher
```

Then add to your MCP config:

```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "ira-researcher",
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

### Option B: Run from source

```powershell
git clone https://github.com/neuralnexustech/IRA-RESEARCHER.git
cd IRA-RESEARCHER
npm install
npx puppeteer browsers install chrome
```

Then add to your MCP config (replace path):

```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

### Add to Any MCP Client

<details>
<summary><b>Cursor</b></summary>

`.cursor/mcp.json` — add to the `mcpServers` object:

```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Claude Code CLI</b></summary>

Run in terminal:
```powershell
claude mcp add ira-researcher node C:\path\to\IRA-RESEARCHER\src\index.js --env IRA_HEADLESS=false --env IRA_WINDOW=maximize --env IRA_GHOST=true
```

Or manually edit `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>OpenCode</b></summary>

Project root `opencode.json`:
```json
{
  "mcp": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code / GitHub Copilot</b></summary>

`.vscode/mcp.json`:
```json
{
  "servers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cline (VS Code)</b></summary>

VS Code Settings → Extensions → Cline → MCP Servers → Add:

```json
{
  "ira-researcher": {
    "command": "node",
    "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
    "env": {
      "IRA_HEADLESS": "false",
      "IRA_WINDOW": "maximize",
      "IRA_GHOST": "true"
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`.windsurfrules` or MCP settings:
```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Aider</b></summary>

`.aider.conf.yml`:
```yaml
mcp-servers:
  ira-researcher:
    command: node
    args:
      - "C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"
    env:
      IRA_HEADLESS: "false"
      IRA_WINDOW: "maximize"
      IRA_GHOST: "true"
```

Or via CLI:
```powershell
aider --mcp-server ira-researcher node C:\path\to\IRA-RESEARCHER\src\index.js
```

</details>

<details>
<summary><b>Zed</b></summary>

`~/.config/zed/settings.json` → add to `context_servers`:
```json
{
  "context_servers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Other (generic MCP client)</b></summary>

Any MCP-compatible tool uses this JSON:
```json
{
  "mcpServers": {
    "ira-researcher": {
      "command": "node",
      "args": ["C:\\path\\to\\IRA-RESEARCHER\\src\\index.js"],
      "env": {
        "IRA_HEADLESS": "false",
        "IRA_WINDOW": "maximize",
        "IRA_GHOST": "true"
      }
    }
  }
}
```

</details>

### 3. Use

The 43 tools appear automatically: `ira_navigate`, `ira_click`, `ira_screenshot`, etc.

## 🧰 Tools (43)

| Category | Tools |
|---|---|
| Navigation | `ira_navigate`, `ira_go_back`, `ira_go_forward`, `ira_reload` |
| Interaction | `ira_click`, `ira_type`, `ira_hover`, `ira_drag`, `ira_upload`, `ira_select`, `ira_keyboard` |
| Vision & Reading | `ira_screenshot`, `ira_element_screenshot`, `ira_extract_images`, `ira_get_state`, `ira_read_page`, `ira_find`, `ira_extract_text`, `ira_extract_table`, `ira_get_html` |
| Tabs | `ira_tabs`, `ira_switch_tab`, `ira_close_tab`, `ira_new_tab` |
| Debug & DevTools | `ira_console`, `ira_network`, `ira_javascript`, `ira_inspect_element`, `ira_get_styles`, `ira_performance`, `ira_storage`, `ira_network_timing`, `ira_audit_accessibility` |
| Utility | `ira_wait`, `ira_scroll`, `ira_set_viewport`, `ira_cookies`, `ira_pdf`, `ira_intercept` |
| Instance Management | `ira_shutdown`, `ira_instances`, `ira_kill_instance`, `ira_kill_all` |
| Health & Status | `ira_health` |

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `IRA_HEADLESS` | `false` | Run browser in headless mode |
| `IRA_WINDOW` | `auto` | Window sizing: `maximize`, `auto` (detect screen), or `WxH` like `1280x800` |
| `IRA_GHOST` | `true` | Enable ghost overlay UI |
| `IRA_STEALTH` | `true` | Enable anti-detection measures |
| `IRA_PROXY` | `` | Proxy URL or comma-separated pool |
| `IRA_PROXY_ROTATE` | `false` | Auto-rotate proxies randomly |
| `IRA_DEBUG` | `false` | Enable verbose debug logging |

> **Window visibility**: Set `IRA_HEADLESS=false` + `IRA_WINDOW=maximize` to open a maximized, focused Chrome window on Windows. The browser auto-detects your screen work area and uses `--start-maximized` to bypass OS focus-steal blocks.

## 👻 Ghost Effects

When enabled, a floating panel appears on the right side of the browser showing all actions in real-time:
- **▶️ Action** (green) — navigation, clicks
- **💭 Thought** (orange) — reasoning
- **✅ Success** (green) — completed actions
- **❌ Error** (red) — failures
- **🟠 Click ripples** — orange expanding circles at click points
- **🟢 Typing glow** — green glow on active input fields
- **🔴 Drag arrows** — animated SVG path from start to end
- **📸 Screenshot flash** — brief white flash

Toggle panel: **Ctrl+Shift+I**

## 📁 Project Structure

```
IRA-RESEARCHER/
├── src/
│   ├── index.js              ← Entry point (43 tools, auto-recovery)
│   ├── pipeline.js           ← Middleware: logging, timing, error wrapping
│   ├── browser.js            ← Single Chrome instance + reuse + registry
│   ├── utils.js              ← Shared helpers (textResult, ghost effects)
│   ├── tools/                ← 43 tools (10 files)
│   │   ├── navigation.js     ← 4 tools
│   │   ├── interaction.js    ← 7 tools
│   │   ├── vision.js         ← 3 tools
│   │   ├── reading.js        ← 6 tools
│   │   ├── tabs.js           ← 4 tools
│   │   ├── debug.js          ← 3 tools
│   │   ├── devtools.js       ← 6 tools
│   │   ├── utility.js        ← 7 tools (wait, scroll, set_viewport, cookies, pdf, intercept, shutdown)
│   │   ├── selectors.js      ← Shared element selectors
│   │   └── status.js         ← 1 tool (ira_health)
│   └── ghost/index.js        ← Ghost effects
├── package.json
└── README.md
```