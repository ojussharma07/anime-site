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
    
    let animeTitle = "";

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

        // 2. PREPARE THE SERVERS
        const encodedTitle = encodeURIComponent(animeTitle);
        const servers = [
            { name: "HiAnime", url: `https://hianime.to/search?keyword=${encodedTitle}` },
            { name: "GogoAnime", url: `https://gogoanime3.co/search.html?keyword=${encodedTitle}` },
            { name: "AnimePahe", url: `https://animepahe.pw/` },
            { name: "Crunchyroll", url: `https://www.crunchyroll.com/search?q=${encodedTitle}` }
        ];

        const serverGrid = document.getElementById('server-grid');
        serverGrid.innerHTML = '';

        servers.forEach(server => {
            const btn = document.createElement('button');
            btn.className = "w-full flex items-center justify-between p-6 bg-zinc-900 border border-zinc-800 hover:border-[#5a4fcf] rounded-2xl group transition-all duration-300 hover:shadow-[0_0_20px_rgba(90,79,207,0.2)]";
            btn.innerHTML = `
                <span class="text-lg font-black text-white uppercase tracking-widest group-hover:text-[#5a4fcf] transition-colors">${server.name}</span>
                <svg class="w-6 h-6 text-zinc-600 group-hover:text-[#5a4fcf] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            `;
            // Open in new tab
            btn.onclick = () => window.open(server.url, '_blank');
            serverGrid.appendChild(btn);
        });

    } catch (error) {
        document.getElementById('anime-title').textContent = "Data Fetch Failed";
    }

    // --- MODAL LOGIC ---
    window.openServerModal = function() {
        const modal = document.getElementById('server-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    };

    window.closeServerModal = function() {
        const modal = document.getElementById('server-modal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
});
