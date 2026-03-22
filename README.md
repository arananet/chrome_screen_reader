# Chrome Screen Analyzer

AI-powered screen analysis Chrome extension using the Claude API. Capture screenshots **or** extract DOM content from any webpage and get instant, actionable insights.

**By Eduardo Arana and Soda** 🥤 **| MIT License**

---

## Features

- **Dual Capture Mode** — Screenshot (visual analysis) or DOM extraction (structured content analysis)
- **Claude API Vision** — Sends screenshots directly to Claude for AI-powered visual understanding
- **Custom Instructions** — Textbox for user prompts to guide the analysis
- **Quick Actions** — Pre-built analysis presets: SEO Audit, Improve Text, Image Review, Doc Analysis, Accessibility, Summarize
- **Floating Sidebar** — Non-intrusive panel that slides in from the right edge
- **Pro UI/UX** — Design system with tokens, skeleton loading, error recovery, accessibility (ARIA, focus management, reduced motion)
- **Secure Credentials** — API key stored locally with XOR obfuscation, never synced
- **Rate Limiting** — 2s gap + 20 requests per 10-minute window with visual indicator
- **Markdown Responses** — Rendered with XSS-safe parser, copy-to-clipboard support
- **Keyboard Shortcut** — `Alt+Shift+A` to toggle panel, `Ctrl+Enter` to submit, `Esc` to close
- **Configurable Model** — Claude Sonnet 4, Haiku 4.5, or Opus 4

## Use Cases

| Scenario | Best Mode | Description |
|---|---|---|
| **SEO Improvement** | DOM | Analyze meta tags, headings, links, keyword usage |
| **Text Enhancement** | Both | Review copy for clarity, grammar, tone |
| **Image Analysis** | Screenshot | Evaluate visuals, layout, optimization |
| **Document Analysis** | DOM | Summarize content, extract key information |
| **Accessibility Audit** | DOM | Check WCAG compliance, semantic structure |
| **UI/UX Review** | Screenshot | Evaluate visual design, hierarchy, spacing |

## Installation

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this project folder
5. Click the extension icon → **Settings**
6. Enter your [Claude API key](https://console.anthropic.com/settings/keys)

## Usage

1. Navigate to any webpage
2. Click the floating search icon on the right edge (or press `Alt+Shift+A`)
3. Choose capture mode: **Screenshot** or **DOM Analysis**
4. Type instructions or click a quick action chip
5. Click **Capture & Analyze** (or `Ctrl+Enter`)
6. View results in the sidebar, copy with one click

## Project Structure

```
chrome_screen_reader/
├── manifest.json              # Manifest V3 configuration
├── background.js              # Service worker: capture, API, rate limiting
├── content.js                 # Floating panel UI injection
├── content.css                # Design system + panel styles
├── popup.html / popup.js      # Extension popup
├── options.html / options.js  # Settings page (API key, model)
├── lib/
│   ├── credential-manager.js  # Secure API key storage (XOR obfuscation)
│   ├── dom-extractor.js       # Structured DOM content extraction
│   ├── rate-limiter.js        # Request throttling
│   └── markdown-renderer.js   # XSS-safe markdown → HTML
├── spec/
│   ├── run-tests.html         # Browser-based test runner
│   └── unit/                  # Unit tests for all lib modules
├── icons/                     # Extension icons (16, 48, 128)
├── .env.example               # Environment template (never commit .env)
├── .gitignore                 # Excludes .env, credentials, build artifacts
├── SPEC.md                    # Technical specification
├── LICENSE                    # MIT License
└── README.md
```

## Running Tests

Open `spec/run-tests.html` in a browser. Tests run automatically and display results for all library modules:

- **Credential Manager** — encryption round-trip, key validation, salt uniqueness
- **Rate Limiter** — gap enforcement, window limits, reset behavior
- **Markdown Renderer** — heading/list/code rendering, XSS prevention
- **DOM Extractor** — structure extraction, truncation, formatting

## Security

- API key stored in `chrome.storage.local` with XOR obfuscation (never in sync storage)
- `.env` file excluded from git via `.gitignore`
- No hardcoded secrets in source code
- Content Security Policy enforced (`script-src 'self'`)
- User prompts length-limited and sanitized
- All markdown output is HTML-escaped before rendering

## License

MIT License — see [LICENSE](LICENSE) for details.
