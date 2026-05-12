// Background service worker for Alexandria extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('Alexandria extension installed');
    // Initialize storage
    chrome.storage.local.set({
        apiBase: 'http://localhost:8001',
        authToken: null,
        userId: null
    });
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CURRENT_VIDEO') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && tab.url) {
                const match = tab.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                sendResponse({ videoId: match ? match[1] : null, url: tab.url });
            } else {
                sendResponse({ videoId: null, url: null });
            }
        });
        return true; // Will respond asynchronously
    }

    if (request.type === 'SAVE_AUTH') {
        chrome.storage.local.set({
            authToken: request.token,
            userId: request.userId
        });
        sendResponse({ success: true });
    }

    if (request.type === 'GET_AUTH') {
        chrome.storage.local.get(['authToken', 'userId'], (result) => {
            sendResponse(result);
        });
        return true;
    }
});

// Inject content script into YouTube pages
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.url.includes('youtube.com') && details.frameId === 0) {
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ['content.js']
        }).catch(err => console.log('Content script injection handled:', err));
    }
}, { url: [{ hostContains: 'youtube.com' }] });
