/**
 * Chrome Screen Analyzer — Background Service Worker
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Handles screen capture, DOM extraction coordination,
 * Claude API communication, rate limiting, and credential management.
 */

importScripts(
  'lib/credential-manager.js',
  'lib/rate-limiter.js'
);

/* ── Constants ─────────────────────────────────────── */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_PROMPT_LENGTH = 4000;

const SYSTEM_PROMPT = `You are a professional screen content analyzer. You analyze screenshots and structured DOM content of webpages and provide detailed, actionable insights based on the user's instructions.

Your capabilities include:
- SEO analysis and improvement suggestions
- Text quality assessment and rewriting recommendations
- Image analysis and optimization tips
- Document structure and content analysis
- Accessibility evaluation
- UI/UX feedback

Rules:
- Always provide structured, clear, and actionable responses
- Use markdown formatting for readability (headings, lists, bold)
- Prioritize the most impactful findings first
- Be specific with recommendations (include examples where possible)`;

/* ── Settings ──────────────────────────────────────── */

async function getModel() {
  const result = await chrome.storage.local.get(['csa_model']);
  return result.csa_model || DEFAULT_MODEL;
}

/* ── Screen Capture ────────────────────────────────── */

async function captureVisibleTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found.');

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png'
  });
  return dataUrl;
}

function extractBase64(dataUrl) {
  const match = dataUrl.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');
  return { mediaType: `image/${match[1]}`, base64: match[2] };
}

/* ── Claude API ────────────────────────────────────── */

function sanitizePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';
  return prompt.trim().substring(0, MAX_PROMPT_LENGTH);
}

async function callClaudeWithImage(apiKey, model, imageDataUrl, userPrompt) {
  const { mediaType, base64 } = extractBase64(imageDataUrl);

  const body = {
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: userPrompt || 'Analyze this screen content and provide a comprehensive summary with improvement suggestions.'
        }
      ]
    }]
  };

  return await sendToClaudeAPI(apiKey, body);
}

async function callClaudeWithDOM(apiKey, model, domContent, userPrompt) {
  const combinedPrompt = `${domContent}\n\n---\n\n**User Instructions:** ${userPrompt || 'Analyze this page content and provide a comprehensive summary with improvement suggestions.'}`;

  const body = {
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: combinedPrompt
    }]
  };

  return await sendToClaudeAPI(apiKey, body);
}

async function sendToClaudeAPI(apiKey, body) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `API error (${response.status})`;

    if (response.status === 401) throw new Error('Invalid API key. Please check your key in Settings.');
    if (response.status === 429) throw new Error('Rate limited by API. Please wait a moment and try again.');
    if (response.status === 529) throw new Error('Claude API is overloaded. Please try again shortly.');
    throw new Error(msg);
  }

  const data = await response.json();
  const textBlock = data.content?.find(b => b.type === 'text');
  return textBlock?.text || 'No response content received.';
}

/* ── Message Handler ───────────────────────────────── */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'analyzeScreen':
      handleAnalyze('screenshot', message.prompt, sender, sendResponse);
      return true;

    case 'analyzeDOM':
      handleAnalyze('dom', message.prompt, sender, sendResponse, message.domContent);
      return true;

    case 'checkApiKey':
      CredentialManager.exists().then(has => sendResponse({ hasKey: has }));
      return true;

    case 'getUsage':
      sendResponse(RateLimiter.getUsage());
      return false;

    case 'togglePanel':
      togglePanelInActiveTab();
      return false;

    case 'openSettings':
      chrome.runtime.openOptionsPage();
      return false;

    default:
      return false;
  }
});

async function handleAnalyze(mode, prompt, _sender, sendResponse, domContent) {
  try {
    // Rate limit check
    const { allowed, gapOk, windowOk } = RateLimiter.canRequest();
    if (!allowed) {
      const wait = RateLimiter.getWaitTime();
      if (!gapOk) {
        throw new Error(`Please wait ${Math.ceil(wait / 1000)}s between requests.`);
      }
      if (!windowOk) {
        throw new Error(`Request limit reached (${RateLimiter.getUsage().maxPerWindow} per 10 min). Wait ${Math.ceil(wait / 1000)}s.`);
      }
    }

    // Load credentials
    const apiKey = await CredentialManager.load();
    if (!apiKey) {
      throw new Error('API key not configured. Open Settings to add your Claude API key.');
    }

    const model = await getModel();
    const sanitizedPrompt = sanitizePrompt(prompt);

    let result;
    if (mode === 'screenshot') {
      const imageDataUrl = await captureVisibleTab();
      result = await callClaudeWithImage(apiKey, model, imageDataUrl, sanitizedPrompt);
    } else {
      if (!domContent) throw new Error('No DOM content received.');
      result = await callClaudeWithDOM(apiKey, model, domContent, sanitizedPrompt);
    }

    RateLimiter.recordRequest();
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function togglePanelInActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
}

/* ── Keyboard Shortcut ─────────────────────────────── */

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    togglePanelInActiveTab();
  }
});
