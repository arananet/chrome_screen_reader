# Chrome Screen Analyzer — Technical Specification

**Version:** 2.0.0
**Authors:** Eduardo Arana and Soda
**License:** MIT

---

## 1. Overview

A Chrome extension (Manifest V3) that captures webpage content via **screenshot** or **DOM extraction** and sends it to the Claude API for AI-powered analysis. Results are displayed in a professional floating sidebar panel.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│  Content Script (content.js)                        │
│  ┌───────────────────────────────────────────────┐  │
│  │  Floating Panel UI                            │  │
│  │  - Toggle trigger (right edge)                │  │
│  │  - Prompt input + quick actions               │  │
│  │  - Capture mode selector (Screenshot / DOM)   │  │
│  │  - Response display (markdown)                │  │
│  │  - History navigation                         │  │
│  └───────────────────────────────────────────────┘  │
│         ▲                                           │
│         │ chrome.runtime.sendMessage                │
│         ▼                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  Background Service Worker (background.js)    │  │
│  │  - Screen capture (captureVisibleTab)         │  │
│  │  - DOM extraction coordinator                 │  │
│  │  - Claude API communication                   │  │
│  │  - Rate limiting & request queue              │  │
│  │  - Credential management (encrypted storage)  │  │
│  └───────────────────────────────────────────────┘  │
│         ▲                                           │
│         │ chrome.storage.local (encrypted)          │
│         ▼                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  Options Page (options.html)                  │  │
│  │  - API key input (masked, validated)          │  │
│  │  - Model selection with cost/speed info       │  │
│  │  - Test connection button                     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Capture Modes

### 3.1 Screenshot Mode
- Uses `chrome.tabs.captureVisibleTab()` to capture a PNG screenshot
- Compresses to JPEG at 85% quality to reduce payload size
- Sends as base64 image to Claude API vision endpoint
- Best for: visual layout analysis, image analysis, UI/UX review

### 3.2 DOM Mode
- Extracts structured page content via content script:
  - `document.title`
  - Meta tags (description, keywords, og:*, twitter:*)
  - Heading hierarchy (h1-h6 with text)
  - Main text content (innerText of body, truncated to 12000 chars)
  - Image inventory (src, alt, dimensions)
  - Link inventory (href, text)
  - Semantic structure (nav, main, article, section, aside, footer)
- Sends as structured text to Claude API
- Best for: SEO analysis, content review, accessibility audit

---

## 4. Security Specification

### 4.1 Credential Storage
- API key stored in `chrome.storage.local` (NOT sync — never transmitted)
- Key obfuscated with XOR cipher using extension-unique salt
- Key never logged, never included in error reports
- Key input field uses `type="password"` with no autocomplete

### 4.2 Request Security
- API calls made from background service worker only (isolated context)
- Content Security Policy enforced via manifest
- No inline scripts in HTML pages
- User prompts length-limited to 4000 characters

### 4.3 Files & Source Control
- `.env` file for local development config (never committed)
- `.gitignore` excludes: `.env`, `*.pem`, `*.crx`, `node_modules/`, `.DS_Store`
- No hardcoded keys, tokens, or secrets in source

---

## 5. UI/UX Specification

### 5.1 Design System

**Colors:**
- Primary: `#6366f1` (Indigo 500)
- Primary Hover: `#4f46e5` (Indigo 600)
- Primary Light: `#eef2ff` (Indigo 50)
- Success: `#059669`
- Error: `#dc2626`
- Warning: `#d97706`
- Text Primary: `#111827`
- Text Secondary: `#6b7280`
- Border: `#e5e7eb`
- Surface: `#ffffff`
- Background: `#f9fafb`

**Typography:**
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Scale: 11px (caption), 13px (body), 14px (subtitle), 16px (title)

**Spacing:** 4px grid (4, 8, 12, 16, 20, 24, 32)

**Radius:** 6px (small), 8px (medium), 12px (large), 16px (xl)

**Shadows:**
- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 12px rgba(0,0,0,0.1)`
- lg: `-4px 0 24px rgba(0,0,0,0.12)`

### 5.2 Floating Trigger
- 44x44px touch target (WCAG minimum)
- Fixed right edge, vertically centered
- Smooth expand on hover (48px wide)
- Tooltip on hover: "Screen Analyzer (Alt+Shift+A)"
- Subtle pulse animation on first install

### 5.3 Panel Layout (420px sidebar)
- **Header:** gradient bg, title, action buttons (clear, settings, close)
- **Mode Selector:** segmented control (Screenshot | DOM)
- **Input Area:** auto-growing textarea, quick action chips, analyze button
- **Response Area:** scrollable, markdown rendered, copy button, timestamp
- **Footer:** credits, settings link

### 5.4 States
- **Empty:** placeholder illustration + guidance text
- **Loading:** skeleton shimmer + status text with elapsed time
- **Success:** rendered markdown + copy button
- **Error:** error card with retry button + troubleshooting tips
- **No API Key:** setup prompt with direct link to options

### 5.5 Accessibility
- All interactive elements have `aria-label`
- Focus management: trap focus in panel when open
- `aria-live="polite"` for status updates
- Keyboard navigable: Tab through controls, Escape to close
- High contrast borders on focus (`:focus-visible`)
- Reduced motion: respect `prefers-reduced-motion`

---

## 6. API Integration

### 6.1 Request Format (Screenshot)
```json
{
  "model": "<selected-model>",
  "max_tokens": 4096,
  "system": "<system-prompt>",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "<base64>" } },
      { "type": "text", "text": "<user-prompt>" }
    ]
  }]
}
```

### 6.2 Request Format (DOM)
```json
{
  "model": "<selected-model>",
  "max_tokens": 4096,
  "system": "<system-prompt>",
  "messages": [{
    "role": "user",
    "content": "<structured-dom-content>\n\nUser Instructions: <user-prompt>"
  }]
}
```

### 6.3 Rate Limiting
- Minimum 2 second gap between requests
- Maximum 20 requests per 10-minute window
- Visual cooldown indicator on analyze button

---

## 7. Test Specification

### 7.1 Unit Tests (spec/unit/)
- `credential-manager.spec.js` — encryption, storage, retrieval, validation
- `dom-extractor.spec.js` — DOM parsing, truncation, structure
- `rate-limiter.spec.js` — timing, window counting, cooldown
- `markdown-renderer.spec.js` — rendering, XSS prevention, edge cases

### 7.2 Integration Tests (spec/integration/)
- `capture-flow.spec.js` — screenshot + DOM capture pipelines
- `api-communication.spec.js` — request building, error handling, response parsing

---

## 8. File Structure

```
chrome_screen_reader/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.js
├── options.html
├── options.js
├── lib/
│   ├── credential-manager.js
│   ├── dom-extractor.js
│   ├── rate-limiter.js
│   └── markdown-renderer.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── spec/
│   ├── unit/
│   │   ├── credential-manager.spec.js
│   │   ├── dom-extractor.spec.js
│   │   ├── rate-limiter.spec.js
│   │   └── markdown-renderer.spec.js
│   └── run-tests.html
├── .env.example
├── .gitignore
├── LICENSE
├── SPEC.md
└── README.md
```
