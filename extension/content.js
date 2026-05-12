// Content script for injecting Alexandria button into YouTube pages

console.log('Alexandria content script loaded');

// Function to get video ID from page
function getVideoIdFromPage() {
    const url = new URL(window.location.href);
    return url.searchParams.get('v');
}

// Function to add Alexandria button near video controls
function addAlexandriaButton() {
    // Try to find the video info section
    const videoTitle = document.querySelector('h1.title yt-formatted-string') || 
                       document.querySelector('h2 yt-formatted-string') ||
                       document.querySelector('[class*="video-title"]');
    
    const likeButton = document.querySelector('like-button-renderer');
    
    if (!likeButton) {
        // Try again later
        setTimeout(addAlexandriaButton, 1000);
        return;
    }

    // Check if button already exists
    if (document.getElementById('alexandria-button')) {
        return;
    }

    // Create Alexandria button
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'alexandria-button';
    buttonContainer.style.cssText = `
        display: inline-block;
        margin-left: 8px;
        vertical-align: middle;
    `;

    const button = document.createElement('button');
    button.textContent = '✨ Smart Summary';
    button.style.cssText = `
        padding: 8px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.3s ease;
    `;

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
    });

    button.addEventListener('click', () => {
        chrome.runtime.sendMessage(
            { type: 'OPEN_POPUP', videoId: getVideoIdFromPage() },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error communicating with popup');
                    // Open popup in new window
                    chrome.runtime.openOptionsPage?.();
                }
            }
        );
    });

    buttonContainer.appendChild(button);

    // Find the place to insert the button
    const likeButtonParent = likeButton.closest('#info-strings') || 
                             likeButton.closest('[class*="info"]') ||
                             likeButton.parentElement;

    if (likeButtonParent) {
        likeButtonParent.appendChild(buttonContainer);
    }
}

// Wait for page to load and add button
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAlexandriaButton);
} else {
    setTimeout(addAlexandriaButton, 500);
}

// Also try to add button when new content loads (for YouTube infinite scroll)
const observer = new MutationObserver((mutations) => {
    // Check if we need to re-inject the button
    setTimeout(addAlexandriaButton, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});

// Inject small CSS into page for better styling
const style = document.createElement('style');
style.textContent = `
    #alexandria-button {
        animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('Alexandria content script ready');
