document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('summarize-btn');
  const infoDiv = document.getElementById('video-info');
  const titleSpan = document.getElementById('video-title');
  
  let currentUrl = null;

  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
      currentUrl = tab.url;
      infoDiv.style.display = 'block';
      titleSpan.textContent = tab.title || 'YouTube Video';
      btn.innerHTML = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Analyze with Alexandria`;
    } else {
      titleSpan.textContent = 'Open a YouTube video first';
      btn.innerHTML = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Open Web App`;
    }

    btn.addEventListener('click', () => {
      let appUrl = 'http://localhost:5173/';
      if (currentUrl) {
        appUrl += `?url=${encodeURIComponent(currentUrl)}`;
      }
      chrome.tabs.create({ url: appUrl });
    });
  } catch (err) {
    console.error(err);
  }
});
