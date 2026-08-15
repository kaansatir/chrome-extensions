document.getElementById('extractBtn').addEventListener('click', async () => {
  const resultsBox = document.getElementById('results');
  
  // Get the current active tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Verify we are on a YouTube playlist page
  if (tab.url.includes("youtube.com/playlist")) {
    resultsBox.value = "Extracting...";
    
    // Execute the scrapeLinks function on the YouTube page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeLinks
    }, (injectionResults) => {
      if (injectionResults && injectionResults[0] && injectionResults[0].result) {
        const links = injectionResults[0].result;
        if (links.length > 0) {
          resultsBox.value = links.join('\n');
          resultsBox.select(); // Auto-select the text for easy copying
        } else {
          resultsBox.value = "No links found. Make sure you are on a playlist page.";
        }
      }
    });
  } else {
    resultsBox.value = "Error: Please open a valid YouTube playlist page (URL must contain 'youtube.com/playlist').";
  }
});

// This function runs in the context of the YouTube web page
function scrapeLinks() {
  // YouTube uses 'a#video-title' for playlist item links
  const linkElements = document.querySelectorAll('a#video-title');
  const videoUrls = [];

  linkElements.forEach(a => {
    if (a.href) {
      try {
        const url = new URL(a.href);
        const videoId = url.searchParams.get('v');
        if (videoId) {
          // Format as a clean watch URL, stripping the playlist index
          videoUrls.push(`https://www.youtube.com/watch?v=${videoId}`);
        }
      } catch (e) {
        // Ignore malformed URLs
      }
    }
  });

  // Remove duplicates using a Set
  return [...new Set(videoUrls)];
}
