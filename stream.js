document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jikanId = urlParams.get('id');

    if (!jikanId) {
        document.getElementById('anime-title').textContent = "Error: No Anime Found";
        return;
    }

    // API Endpoints
    const JIKAN_API = `https://api.jikan.moe/v4/anime/${jikanId}`;
    // NOTE: Public consumet instances change frequently. 
    // If this URL fails, you need to self-host or find an active public instance.
    const CONSUMET_API = `https://api.consumet.org/anime/gogoanime`; 

    // Setup Video Player
    const video = document.getElementById('player');
    const playerContainer = document.getElementById('player-container');
    const statusText = document.getElementById('player-status');
    const defaultOptions = {}; 
    let player = new Plyr(video, defaultOptions);

    try {
        // 1. Fetch Metadata from Jikan
        const jikanRes = await fetch(JIKAN_API);
        const jikanData = await jikanRes.json();
        const anime = jikanData.data;

        // Populate UI with Metadata
        document.getElementById('anime-title').textContent = anime.title_english || anime.title;
        document.getElementById('anime-desc').textContent = anime.synopsis || "No synopsis available.";
        document.getElementById('anime-meta').innerHTML = `<span class="text-indigo-400">★ ${anime.score || 'N/A'}</span> <span>•</span> <span>${anime.status}</span> <span>•</span> <span>${anime.type}</span>`;
        
        const cover = document.getElementById('anime-cover');
        cover.src = anime.images?.jpg?.large_image_url;
        cover.classList.remove('hidden');

        // 2. Search for the Streaming ID using the title
        const searchQuery = encodeURIComponent(anime.title_english || anime.title);
        const searchRes = await fetch(`${CONSUMET_API}/${searchQuery}`);
        const searchData = await searchRes.json();

        if (!searchData.results || searchData.results.length === 0) {
            document.getElementById('episode-grid').innerHTML = `<p class="text-red-500 col-span-full">No streaming servers found for this anime.</p>`;
            return;
        }

        // Grab the closest match (usually the first result)
        const streamingId = searchData.results[0].id;

        // 3. Fetch Episodes for that ID
        const infoRes = await fetch(`${CONSUMET_API}/info/${streamingId}`);
        const infoData = await infoRes.json();

        // 4. Render Episode Buttons
        const epGrid = document.getElementById('episode-grid');
        document.getElementById('ep-count').textContent = `${infoData.episodes.length} Episodes`;
        epGrid.innerHTML = '';

        infoData.episodes.forEach(ep => {
            const btn = document.createElement('button');
            btn.className = "bg-[#151518] border border-zinc-800 hover:border-indigo-500 hover:bg-indigo-600/10 text-zinc-300 hover:text-white transition rounded-xl py-3 text-sm font-bold text-center w-full";
            btn.textContent = `Episode ${ep.number}`;
            
            btn.onclick = () => loadVideo(ep.id, btn);
            epGrid.appendChild(btn);
        });

    } catch (error) {
        console.error(error);
        document.getElementById('episode-grid').innerHTML = `<p class="text-red-500 col-span-full">API Error. The public streaming server might be down or rate-limited.</p>`;
    }

    // --- VIDEO LOADING LOGIC ---
    async function loadVideo(episodeId, activeBtn) {
        statusText.textContent = "Loading stream...";
        video.classList.add('hidden');

        // Highlight active button
        document.querySelectorAll('#episode-grid button').forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-600/10', 'text-white'));
        activeBtn.classList.add('border-indigo-500', 'bg-indigo-600/10', 'text-white');

        try {
            const streamRes = await fetch(`${CONSUMET_API}/watch/${episodeId}`);
            const streamData = await streamRes.json();

            // Find best quality (usually auto or 1080p)
            const source = streamData.sources.find(s => s.quality === 'auto' || s.quality === '1080p') || streamData.sources[0];

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(source.url);
                hls.attachMedia(video);
                window.hls = hls; // Make it global so we can destroy it later if needed
                
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    statusText.classList.add('hidden');
                    video.classList.remove('hidden');
                    video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native Safari support
                video.src = source.url;
                video.addEventListener('loadedmetadata', function () {
                    statusText.classList.add('hidden');
                    video.classList.remove('hidden');
                    video.play();
                });
            }
        } catch (error) {
            statusText.textContent = "Failed to load stream. Server might be blocked.";
            statusText.classList.remove('hidden');
        }
    }
});
