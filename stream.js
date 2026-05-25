document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jikanId = urlParams.get('id');

    if (!jikanId) {
        document.getElementById('anime-title').textContent = "Error: No Anime ID provided in URL";
        return;
    }

    // Fetch Full Anime Details & Characters
    const JIKAN_API = `https://api.jikan.moe/v4/anime/${jikanId}/full`;
    const CAST_API = `https://api.jikan.moe/v4/anime/${jikanId}/characters`;

    try {
        // --- 1. POPULATE UI METADATA ---
        const [animeRes, castRes] = await Promise.all([ fetch(JIKAN_API), fetch(CAST_API) ]);
        const animeData = await animeRes.json();
        const castData = await castRes.json();
        const anime = animeData.data;

        const title = anime.title_english || anime.title;
        document.getElementById('anime-title').textContent = title;
        document.getElementById('anime-desc').textContent = anime.synopsis || "No synopsis available for this title.";
        
        // Load Cover Art
        const cover = document.getElementById('anime-cover');
        cover.src = anime.images?.jpg?.large_image_url;
        cover.onload = () => cover.classList.remove('hidden');

        // Load Backdrop (If available from trailer images, otherwise fallback to cover)
        const backdropUrl = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
        const backdrop = document.getElementById('backdrop-container');
        if (backdropUrl) {
            backdrop.style.backgroundImage = `url('${backdropUrl}')`;
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
        }

        // Build Badges (Matching Screenshot exact style)
        let badgesHTML = ``;
        if (anime.score) badgesHTML += `<span class="bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-md border border-yellow-500/30 shadow-sm">★ ${anime.score}</span>`;
        if (anime.rating) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.rating.split(' ')[0]}</span>`;
        if (anime.type) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.type}</span>`;
        if (anime.year) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.year}</span>`;
        if (anime.status) badgesHTML += `<span class="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">${anime.status}</span>`;
        
        let genresList = anime.genres.map(g => g.name).concat(anime.themes.map(t => t.name)).slice(0, 4);
        if (genresList.length > 0) {
            badgesHTML += `<span class="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md ml-2">${genresList.join(', ')}</span>`;
        }
        document.getElementById('anime-badges').innerHTML = badgesHTML;

        // Load Official Trailer
        if (anime.trailer?.embed_url) {
            document.getElementById('trailer-container').innerHTML = `
                <iframe src="${anime.trailer.embed_url}?autoplay=0&controls=1&modestbranding=1" class="w-full h-full" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        }

        // Load Main Cast (Top 4 Characters)
        const castContainer = document.getElementById('cast-list');
        castContainer.innerHTML = '';
        const mainCast = castData.data.slice(0, 4);
        
        if (mainCast.length === 0) castContainer.innerHTML = `<p class="text-zinc-600 text-sm font-bold">Cast information unavailable.</p>`;
        
        mainCast.forEach(c => {
            const voiceActor = c.voice_actors.find(va => va.language === 'Japanese');
            const vaName = voiceActor ? voiceActor.person.name : "Unknown VA";
            
            castContainer.innerHTML += `
                <div class="flex items-center gap-4 bg-[#151518] border border-zinc-800/50 p-2.5 rounded-xl hover:bg-zinc-800 transition">
                    <img src="${c.character.images?.jpg?.image_url}" class="w-12 h-12 rounded-lg object-cover shadow-md">
                    <div class="flex-1 overflow-hidden">
                        <h4 class="text-sm font-bold text-white truncate">${c.character.name}</h4>
                        <p class="text-[10px] text-zinc-500 font-bold tracking-wide uppercase mt-0.5">VA: ${vaName}</p>
                    </div>
                </div>
            `;
        });

        // --- 2. SETUP IFRAME STREAMING SERVERS ---
        const encodedTitle = encodeURIComponent(title);
        const servers = [
            { name: "HiAnime", url: `https://hianime.to/search?keyword=${encodedTitle}` },
            { name: "GogoAnime", url: `https://gogoanime3.co/search.html?keyword=${encodedTitle}` },
            { name: "9anime", url: `https://9anime.org.lv/search?keyword=${encodedTitle}` },
            { name: "MyFlixer", url: `https://myflixer.bz/search/${encodedTitle}` },
            { name: "AniGo", url: `https://anigo.to/search?keyword=${encodedTitle}` },
            { name: "AnimePahe", url: `https://animepahe.pw/` } 
        ];

        const serverList = document.getElementById('server-list');
        servers.forEach(server => {
            const btn = document.createElement('button');
            btn.className = "shrink-0 bg-zinc-800 hover:bg-[#5a4fcf] text-zinc-300 hover:text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition duration-300";
            btn.textContent = server.name;
            btn.onclick = () => loadIframe(server.url, btn);
            serverList.appendChild(btn);
        });

    } catch (error) {
        console.error("Error loading info:", error);
        document.getElementById('anime-title').textContent = "Failed to load data";
    }

    // --- IFRAME MODAL LOGIC ---
    window.openIframeModal = function() {
        const modal = document.getElementById('iframe-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    };

    window.closeIframeModal = function() {
        const modal = document.getElementById('iframe-modal');
        modal.classList.add('opacity-0');
        
        // Stop iframe from playing audio in background when closed
        document.getElementById('stream-frame').src = "";
        document.getElementById('iframe-status').classList.remove('hidden');
        document.getElementById('stream-frame').classList.add('hidden');
        
        // Reset button styles
        document.querySelectorAll('#server-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white');
            b.classList.add('bg-zinc-800', 'text-zinc-300');
        });

        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    function loadIframe(url, activeBtn) {
        const iframe = document.getElementById('stream-frame');
        const statusText = document.getElementById('iframe-status');

        statusText.classList.add('hidden');
        iframe.classList.remove('hidden');

        // Style the active server button
        document.querySelectorAll('#server-list button').forEach(b => {
            b.classList.remove('bg-[#5a4fcf]', 'text-white');
            b.classList.add('bg-zinc-800', 'text-zinc-300');
        });
        activeBtn.classList.remove('bg-zinc-800', 'text-zinc-300');
        activeBtn.classList.add('bg-[#5a4fcf]', 'text-white');

        // Set the iframe source
        iframe.src = url;
    }
});
