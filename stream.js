document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jikanId = urlParams.get('id');

    if (!jikanId) {
        document.getElementById('anime-title').textContent = "No Anime Selected";
        document.getElementById('anime-desc').textContent = "Please return to the home page and select an anime to view its details.";
        document.getElementById('anime-badges').innerHTML = "";
        return;
    }

    // --- APIs ---
    const JIKAN_API = `https://api.jikan.moe/v4/anime/${jikanId}/full`;
    const CAST_API = `https://api.jikan.moe/v4/anime/${jikanId}/characters`;
    
    // We use GogoAnime via Consumet API as the reliable engine to get episodes
    const CONSUMET_API = `https://api.consumet.org/anime/gogoanime`; 

    // --- GLOBALS ---
    let animeTitle = "";
    let episodesLoaded = false;
    const video = document.getElementById('video-element');
    const statusText = document.getElementById('player-status');
    let plyrInstance = new Plyr(video);

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
        document.getElementById('anime-desc').textContent = "Please refresh the page in a few seconds.";
    }

    // --- MODAL & EPISODE EXTRACTION LOGIC ---
    window.openPlayerModal = async function() {
        const modal = document.getElementById('player-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);

        // Only fetch episodes once
        if (episodesLoaded || !animeTitle) return;
        episodesLoaded = true;

        try {
            const encodedTitle = encodeURIComponent(animeTitle);
            const searchRes = await fetch(`${CONSUMET_API}/${encodedTitle}`);
            const searchData = await searchRes.json();

            if (!searchData.results || searchData.results.length === 0) throw new Error("Not found on server");

            const streamingId = searchData.results[0].id;
            const infoRes = await fetch(`${CONSUMET_API}/info/${streamingId}`);
            const infoData = await infoRes.json();

            const epList = document.getElementById('episode-list');
            epList.innerHTML = '';

            infoData.episodes.forEach(ep => {
                const btn = document.createElement('button');
                btn.className = "shrink-0 bg-zinc-800 hover:bg-[#5a4fcf] text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition duration-300";
                btn.textContent = `EP ${ep.number}`;
                btn.onclick = () => loadVideo(ep.id, btn);
                epList.appendChild(btn);
            });

        } catch (error) {
            document.getElementById('ep-loading-text').textContent = "Failed to extract episodes. API rate limit reached.";
            document.getElementById('ep-loading-text').classList.add('text-red-500');
        }
    };

    window.closePlayerModal = function() {
        const modal = document.getElementById('player-modal');
        modal.classList.add('opacity-0');
        
        // Stop video and clear source
        if (window.hls) window.hls.destroy();
        video.pause();
        video.src = "";
        
        statusText.classList.remove('hidden');
        video.classList.add('hidden');
        
        document.querySelectorAll('#episode-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white');
            b.classList.add('bg-zinc-800', 'text-zinc-300');
        });

        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    // --- RAW VIDEO PLAYBACK LOGIC ---
    async function loadVideo(episodeId, activeBtn) {
        statusText.textContent = "Connecting to server to extract video...";
        statusText.classList.remove('hidden');
        video.classList.add('hidden');

        document.querySelectorAll('#episode-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white');
            b.classList.add('bg-zinc-800', 'text-zinc-300');
        });
        activeBtn.classList.remove('bg-zinc-800', 'text-zinc-300');
        activeBtn.classList.add('bg-[#5a4fcf]', 'text-white');

        try {
            const streamRes = await fetch(`${CONSUMET_API}/watch/${episodeId}`);
            const streamData = await streamRes.json();

            // Find best quality link
            const source = streamData.sources.find(s => s.quality === '1080p' || s.quality === 'auto') || streamData.sources[0];

            if (Hls.isSupported()) {
                if (window.hls) window.hls.destroy();
                const hls = new Hls();
                hls.loadSource(source.url);
                hls.attachMedia(video);
                window.hls = hls;
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    statusText.classList.add('hidden');
                    video.classList.remove('hidden');
                    video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source.url;
                video.addEventListener('loadedmetadata', () => {
                    statusText.classList.add('hidden');
                    video.classList.remove('hidden');
                    video.play();
                });
            }
        } catch (error) {
            statusText.textContent = "Stream blocked. API currently overloaded.";
        }
    }
});
