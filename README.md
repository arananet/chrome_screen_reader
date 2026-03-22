# Chrome Screen Analyzer

AI-powered screen analysis Chrome extension using Claude API. Capture any webpage and get instant, actionable insights for SEO, content improvement, accessibility, and document analysis.

**By Eduardo Arana and Soda** 🥤

## Features

- **Screen Capture & Analysis** — One-click capture of visible tab content, analyzed by Claude AI
- **Custom Instructions** — Textbox for user prompts to guide the analysis
- **Quick Actions** — Pre-built prompts for common tasks (SEO Audit, Improve Text, Analyze Images, Document Review, Accessibility, Summarize)
- **Floating Panel** — Non-intrusive sidebar that slides in from the right
- **Markdown Rendering** — Formatted responses with copy-to-clipboard support
- **Keyboard Shortcut** — Toggle with `Alt+Shift+A`
- **Configurable Model** — Choose between Claude Sonnet, Haiku, or Opus

## Use Cases

| Scenario | Description |
|---|---|
| **SEO Improvement** | Analyze page structure, meta tags, headings, keyword usage, and get actionable recommendations |
| **Text Enhancement** | Review and improve copy for clarity, grammar, tone, and readability |
| **Image Analysis** | Evaluate visual elements, suggest alt text, and identify optimization opportunities |
| **Document Analysis** | Summarize documents, extract key information, and suggest structural improvements |
| **Accessibility Audit** | Check WCAG compliance, contrast, navigation, and semantic structure |

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the project folder
5. Click the extension icon or press `Alt+Shift+A` to open the panel
6. Go to **Settings** and enter your [Claude API key](https://console.anthropic.com/settings/keys)

## Usage

1. Navigate to any webpage you want to analyze
2. Click the floating **magnifying glass** button on the right edge, or press `Alt+Shift+A`
3. Type your instructions in the text box (or click a Quick Action)
4. Click **Capture & Analyze**
5. View the results in the sidebar panel
6. Use the **Copy** button to copy the response

## Project Structure

```
chrome_screen_reader/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker: screen capture + Claude API
├── content.js             # Floating panel UI injection
├── content.css            # Panel styles
├── popup.html / popup.js  # Extension popup
├── options.html / options.js  # Settings page
├── icons/                 # Extension icons
├── LICENSE                # MIT License
└── README.md
```

## Configuration

| Setting | Description |
|---|---|
| **API Key** | Your Anthropic Claude API key (`sk-ant-...`) |
| **Model** | Claude Sonnet 4 (default), Haiku 4.5 (faster), or Opus 4 (most capable) |

## Permissions

- `activeTab` — Capture the visible tab screenshot
- `storage` — Store API key and preferences locally
- `sidePanel` — Side panel support
- `host_permissions` for `api.anthropic.com` — Send images to Claude API

## License

MIT License — see [LICENSE](LICENSE) for details.
