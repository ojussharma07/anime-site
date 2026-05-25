document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jikanId = urlParams.get('id');

    if (!jikanId) {
        document.getElementById('anime-title').textContent = "No Anime Selected";
        return;
    }

    // --- APIs ---
    const JIKAN_API = `https://api.jikan.moe/v4/anime/${jikanId}/full`;
    const CAST_API = `https://api.jikan.moe/v4/anime/${jikanId}/characters`;
    const CONSUMET_API = `https://api.consumet.org/anime/gogoanime`; 

    // --- GLOBALS ---
    let animeTitle = "";
    let episodesLoaded = false;
    let plyrInstance = null;
    
    const videoWrapper = document.getElementById('video-wrapper');
    const videoElement = document.getElementById('video-element');
    const placeholder = document.getElementById('player-placeholder');
    const statusText = document.getElementById('player-status');

    try {
        // 1. POPULATE UI
        const [animeRes, castRes] = await Promise.all([fetch(JIKAN_API), fetch(CAST_API)]);
        if (!animeRes.ok) throw new Error("Anime API rate limit");
        
        const animeData = await animeRes.json();
        const castData = await castRes.json();
        const anime = animeData.data;

        animeTitle = anime.title_english || anime.title;
        document.getElementById('anime-title').textContent = animeTitle;
        document.getElementById('anime-desc').textContent = anime.synopsis || "No synopsis available.";
        
        const cover = document.getElementById('anime-cover');
        cover.src = anime.images?.jpg?.large_image_url || '';
        cover.onload = () => cover.classList.remove('hidden');

        const backdropUrl = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
        const backdrop = document.getElementById('backdrop-container');
        if (backdropUrl) {
            backdrop.style.backgroundImage = `url('${backdropUrl}')`;
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
        }

        let badgesHTML = ``;
        if (anime.score) badgesHTML += `<span class="bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-md border border-yellow-500/30 shadow-sm">★ ${anime.score}</span>`;
        if (anime.rating) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.rating.split(' ')[0]}</span>`;
        if (anime.type) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.type}</span>`;
        if (anime.year) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.year}</span>`;
        if (anime.status) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.status}</span>`;
        document.getElementById('anime-badges').innerHTML = badgesHTML;

        document.getElementById('action-buttons').classList.remove('hidden');

        if (anime.trailer?.embed_url) {
            document.getElementById('trailer-container').innerHTML = `<iframe src="${anime.trailer.embed_url}?autoplay=0&controls=1&modestbranding=1" class="w-full h-full" frameborder="0" allowfullscreen></iframe>`;
        }

        const castContainer = document.getElementById('cast-list');
        castContainer.innerHTML = '';
        const mainCast = castData.data ? castData.data.slice(0, 4) : [];
        if (mainCast.length === 0) castContainer.innerHTML = `<p class="text-zinc-600 text-sm font-bold">Cast information unavailable.</p>`;
        
        mainCast.forEach(c => {
            const voiceActor = c.voice_actors?.find(va => va.language === 'Japanese');
            const vaName = voiceActor ? voiceActor.person.name : "Unknown VA";
            castContainer.innerHTML += `
                <div class="flex items-center gap-4 bg-[#151518] border border-zinc-800/50 p-2.5 rounded-xl hover:bg-zinc-800 transition">
                    <img src="${c.character.images?.jpg?.image_url || ''}" class="w-12 h-12 rounded-lg object-cover shadow-md">
                    <div class="flex-1 overflow-hidden">
                        <h4 class="text-sm font-bold text-white truncate">${c.character.name}</h4>
                        <p class="text-[10px] text-zinc-500 font-bold tracking-wide uppercase mt-0.5">VA: ${vaName}</p>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        document.getElementById('anime-title').textContent = "Data Fetch Failed";
    }

    // --- MODAL & EPISODE EXTRACTION LOGIC ---
    window.openPlayerModal = function() {
        const modal = document.getElementById('player-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);

        if (!episodesLoaded && animeTitle) {
            fetchEpisodes();
        }
    };

    window.closePlayerModal = function() {
        const modal = document.getElementById('player-modal');
        modal.classList.add('opacity-0');
        
        // Stop video cleanly
        if (window.hls) window.hls.destroy();
        if (plyrInstance) plyrInstance.destroy();
        plyrInstance = null;
        videoElement.src = "";
        
        // Reset UI to placeholder
        videoWrapper.classList.add('hidden');
        placeholder.classList.remove('hidden');
        statusText.textContent = "Select an episode to start";
        
        // Reset button highlights
        document.querySelectorAll('#episode-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white', 'border-[#5a4fcf]');
            b.classList.add('bg-zinc-800/50', 'text-zinc-400', 'border-zinc-800');
        });

        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    async function fetchEpisodes() {
        episodesLoaded = true;
        const epList = document.getElementById('episode-list');

        try {
            const encodedTitle = encodeURIComponent(animeTitle);
            const searchRes = await fetch(`${CONSUMET_API}/${encodedTitle}`);
            
            if (!searchRes.ok) throw new Error("Rate Limited");
            const searchData = await searchRes.json();

            if (!searchData.results || searchData.results.length === 0) {
                epList.innerHTML = `<div class="p-4 text-center text-red-400 text-sm font-bold">No episodes found on server.</div>`;
                return;
            }

            const streamingId = searchData.results[0].id;
            const infoRes = await fetch(`${CONSUMET_API}/info/${streamingId}`);
            if (!infoRes.ok) throw new Error("Rate Limited");
            const infoData = await infoRes.json();

            // Update badge
            const badge = document.getElementById('ep-count-badge');
            badge.textContent = `${infoData.episodes.length} EPS`;
            badge.classList.remove('hidden');

            epList.innerHTML = '';
            infoData.episodes.forEach(ep => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left px-4 py-3 bg-zinc-800/50 border border-zinc-800 hover:border-[#5a4fcf] text-zinc-400 hover:text-white transition rounded-xl text-sm font-bold flex items-center justify-between group";
                btn.innerHTML = `
                    <span>Episode ${ep.number}</span>
                    <svg class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"></path></svg>
                `;
                btn.onclick = () => loadVideo(ep.id, btn);
                epList.appendChild(btn);
            });

        } catch (error) {
            episodesLoaded = false; // allow retry
            epList.innerHTML = `
                <div class="p-6 flex flex-col items-center text-center">
                    <svg class="w-10 h-10 text-red-500/80 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p class="text-zinc-300 text-sm font-bold mb-1">Server Overloaded</p>
                    <p class="text-zinc-500 text-xs mb-4">The public API blocked the request. Please try again.</p>
                    <button onclick="fetchEpisodes()" class="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition">Retry Connection</button>
                </div>
            `;
        }
    }

    // --- RAW VIDEO PLAYBACK LOGIC ---
    async function loadVideo(episodeId, activeBtn) {
        // UI Updates for loading
        placeholder.classList.remove('hidden');
        videoWrapper.classList.add('hidden');
        statusText.textContent = "Connecting to video server...";
        
        // Destroy old player instance if switching episodes
        if (window.hls) window.hls.destroy();
        if (plyrInstance) plyrInstance.destroy();

        // Highlight sidebar button
        document.querySelectorAll('#episode-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white', 'border-[#5a4fcf]');
            b.classList.add('bg-zinc-800/50', 'text-zinc-400', 'border-zinc-800');
            b.querySelector('svg').classList.add('opacity-0');
        });
        activeBtn.classList.remove('bg-zinc-800/50', 'text-zinc-400', 'border-zinc-800');
        activeBtn.classList.add('bg-[#5a4fcf]', 'text-white', 'border-[#5a4fcf]');
        activeBtn.querySelector('svg').classList.remove('opacity-0');

        try {
            const streamRes = await fetch(`${CONSUMET_API}/watch/${episodeId}`);
            if (!streamRes.ok) throw new Error("Video Blocked");
            const streamData = await streamRes.json();

            const source = streamData.sources.find(s => s.quality === '1080p' || s.quality === 'auto') || streamData.sources[0];

            // Setup new player
            plyrInstance = new Plyr(videoElement, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
            });

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(source.url);
                hls.attachMedia(videoElement);
                window.hls = hls;
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    placeholder.classList.add('hidden');
                    videoWrapper.classList.remove('hidden');
                    videoElement.play();
                });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = source.url;
                videoElement.addEventListener('loadedmetadata', () => {
                    placeholder.classList.add('hidden');
                    videoWrapper.classList.remove('hidden');
                    videoElement.play();
                });
            }
        } catch (error) {
            statusText.textContent = "Video server rejected connection (Rate Limit).";
        }
    }
});
