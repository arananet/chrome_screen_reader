/**
 * Chrome Screen Analyzer - Background Service Worker
 * Authors: Eduardo Arana and Soda 🥤
 * License: MIT
 *
 * Handles screen capture and Claude API communication.
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

async function getSettings() {
  const result = await chrome.storage.sync.get(['apiKey', 'model']);
  return {
    apiKey: result.apiKey || null,
    model: result.model || DEFAULT_MODEL
  };
}

async function captureVisibleTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found');

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
    quality: 90
  });

  return dataUrl;
}

function extractBase64(dataUrl) {
  const match = dataUrl.match(/^data:image\/(png|jpeg|gif|webp);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URL');
  return { mediaType: `image/${match[1]}`, base64: match[2] };
}

async function analyzeWithClaude(imageDataUrl, userPrompt) {
  const { apiKey, model } = await getSettings();
  if (!apiKey) {
    throw new Error('API key not configured. Please set your Claude API key in the extension options.');
  }

  const { mediaType, base64 } = extractBase64(imageDataUrl);

  const systemPrompt = `You are a professional screen content analyzer. You analyze screenshots of webpages and provide detailed, actionable insights based on the user's instructions.

Your capabilities include:
- SEO analysis and improvement suggestions
- Text quality assessment and rewriting recommendations
- Image analysis and optimization tips
- Document structure and content analysis
- Accessibility evaluation
- UI/UX feedback

Always provide structured, clear, and actionable responses. Use markdown formatting for readability.`;

  const requestBody = {
    model: model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64
            }
          },
          {
            type: 'text',
            text: userPrompt || 'Analyze this screen content and provide a comprehensive summary of what you see, including any suggestions for improvement.'
          }
        ]
      }
    ]
  };

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const textContent = data.content?.find(block => block.type === 'text');
  return textContent?.text || 'No response content received.';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'analyzeScreen') {
    handleAnalyzeScreen(message.prompt, sendResponse);
    return true; // keep channel open for async response
  }

  if (message.action === 'togglePanel') {
    handleTogglePanel();
    return false;
  }

  if (message.action === 'checkApiKey') {
    getSettings().then(({ apiKey }) => sendResponse({ hasKey: !!apiKey }));
    return true;
  }
});

async function handleAnalyzeScreen(prompt, sendResponse) {
  try {
    const imageDataUrl = await captureVisibleTab();
    const result = await analyzeWithClaude(imageDataUrl, prompt);
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTogglePanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    handleTogglePanel();
  }
});

chrome.action.onClicked.addListener(() => {
  handleTogglePanel();
});
