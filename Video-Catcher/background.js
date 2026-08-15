// We keep track of video and audio separately to prevent infinite tab loops
// as the browser alternates between requesting video and audio chunks.
let lastVideoUrl = "";
let lastAudioUrl = "";

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        const url = details.url;

        // Make sure it is a playback request first
        if (url.includes("videoplayback")) {
            
            // --- 1. HANDLE VIDEO ---
            if (url.includes("&mime=video")) {
                const newUrl = url.split("&range=")[0];
                
                // Prevent duplicate tabs
                if (lastVideoUrl !== newUrl) {
                    lastVideoUrl = newUrl;
                    console.log("Caught new VIDEO! Opening:", newUrl);
                    chrome.tabs.create({ url: newUrl, active: false });
                }
            }
            
            // --- 2. HANDLE AUDIO ---
            if (url.includes("&mime=audio")) {
                const newUrl = url.split("&range=")[0];
                
                // Prevent duplicate tabs
                if (lastAudioUrl !== newUrl) {
                    lastAudioUrl = newUrl;
                    console.log("Caught new AUDIO! Opening:", newUrl);
                    chrome.tabs.create({ url: newUrl, active: false });
                }
            }
        }
    },
    // Instruct the webRequest API to monitor all URLs
    { urls: ["<all_urls>"] }
);