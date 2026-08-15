// Function to fetch the original title using YouTube's oEmbed endpoint
async function restoreOriginalTitle(videoId) {
    try {
        // oEmbed naturally ignores localization cookies and returns the creator's original title
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) return;
        
        const data = await response.json();
        const originalTitle = data.title;

        if (originalTitle) {
            // Find the video title element in the DOM
            const titleSelectors = [
                '#title h1 yt-formatted-string',
                'h1.ytd-watch-metadata yt-formatted-string'
            ];
            
            let titleElement = null;
            for (const selector of titleSelectors) {
                titleElement = document.querySelector(selector);
                if (titleElement) break;
            }

            if (titleElement && titleElement.textContent !== originalTitle) {
                titleElement.textContent = originalTitle;
                document.title = `${originalTitle} - YouTube`;
                console.log("[Anti-Translate] Title restored to:", originalTitle);
            }
        }
    } catch (error) {
        console.error("[Anti-Translate] Failed to fetch original title:", error);
    }
}

// Function to force the audio track to the "Original" language
function restoreOriginalAudio() {
    const player = document.getElementById('movie_player');
    
    // Check if the YouTube player API is available
    if (player && typeof player.getAvailableAudioTracks === 'function') {
        const tracks = player.getAvailableAudioTracks();
        
        // YouTube labels original tracks with "(Original)" or similar in the displayName
        const originalTrack = tracks.find(track => 
            track.displayName && track.displayName.toLowerCase().includes('original')
        );

        if (originalTrack) {
            player.setAudioTrack(originalTrack);
            console.log("[Anti-Translate] Audio track set to:", originalTrack.displayName);
        }
    }
}

// Main function to run our checks
function runAntiTranslate() {
    // Only run if we are actually watching a video
    if (window.location.pathname !== '/watch') return;

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    
    if (videoId) {
        restoreOriginalTitle(videoId);
        
        // The audio tracks sometimes take a moment to load into the player API
        // We try immediately, and then retry a few times over the next 3 seconds
        restoreOriginalAudio();
        let retries = 0;
        const audioInterval = setInterval(() => {
            restoreOriginalAudio();
            retries++;
            if (retries > 5) clearInterval(audioInterval);
        }, 600);
    }
}

// YouTube is a Single Page Application (SPA), so standard DOMContentLoaded isn't enough.
// We must listen for YouTube's custom navigation events.
window.addEventListener('yt-navigate-finish', () => {
    // Slight delay to ensure YouTube has finished manipulating the DOM
    setTimeout(runAntiTranslate, 500); 
});

// Also run on initial direct page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(runAntiTranslate, 500);
} else {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAntiTranslate, 500);
    });
}
