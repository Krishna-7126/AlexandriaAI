chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('youtube.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle' }).catch(() => {
      // Content script not yet injected — inject it now
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
        }, 300);
      });
    });
  } else {
    chrome.tabs.create({ url: 'http://localhost:5173/' });
  }
});
