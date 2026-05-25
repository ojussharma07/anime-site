document.addEventListener("DOMContentLoaded", () => {
    // 1. NAVIGATION & MODAL INIT
    initNav();
    if (document.getElementById('bug-form')) initBugModal();

    // 2. DASHBOARD ENGINE (Only run if on home.html)
    if (document.getElementById('anime-grid')) {
        renderContinueWatching();
        const urlParams = new URLSearchParams(window.location.search);
        const params = { q: urlParams.get('q'), view: urlParams.get('view'), type: urlParams.get('type'), genreId: urlParams.get('genre_id'), letter: urlParams.get('letter') };
        
        if (params.q) executeAdvancedSearch(params.q);
        else if (params.letter) fetchAnimeData(`https://api.jikan.moe/v4/anime?letter=${params.letter}&order_by=popularity&sort=asc&limit=24`);
        else if (params.genreId) fetchAnimeData(`https://api.jikan.moe/v4/anime?genres=${params.genreId}&order_by=popularity&sort=asc&limit=24`);
        else if (params.type) fetchAnimeData(`https://api.jikan.moe/v4/anime?type=${params.type}&order_by=popularity&sort=desc&limit=24`);
        else if (params.view === 'new') fetchAnimeData("https://api.jikan.moe/v4/seasons/now?limit=24");
        else fetchAnimeData("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24");

        setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/now?limit=5", "col-airing"), 1000);
    }

    // 3. STREAMING ENGINE (Only run if on info.html)
    const videoPlayer = document.getElementById('player');
    if (videoPlayer) {
        const player = new Plyr('#player');
        window.streamAnime = async (provider, episodeId) => {
            try {
                const res = await fetch(`https://api.consumet.org/anime/${provider}/watch/${episodeId}`);
                const data = await res.json();
                const source = data.sources.find(s => s.quality === '1080p') || data.sources[data.sources.length - 1];
                player.source = { type: 'video', sources: [{ src: source.url, type: 'application/x-mpegURL' }] };
            } catch (err) { alert("Streaming currently unavailable. API might be rate-limited."); }
        };
    }
});

// --- HELPER FUNCTIONS ---
function initNav() {
    const navLinks = document.querySelectorAll('.nav-link, nav button');
    navLinks.forEach(link => {
        link.classList.remove('text-indigo-400', 'font-black', 'drop-shadow-md');
        if (link.href && window.location.href.includes(link.href)) {
            link.classList.add('text-indigo-400', 'font-black', 'drop-shadow-md');
        }
    });
}

function initBugModal() {
    const form = document.getElementById('bug-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
            .then(() => { alert("Request sent!"); closeBugModal(); form.reset(); });
    });
}

window.openBugModal = () => { document.getElementById('bug-modal').classList.remove('hidden'); setTimeout(() => document.getElementById('bug-modal').classList.remove('opacity-0'), 10); };
window.closeBugModal = () => { document.getElementById('bug-modal').classList.add('opacity-0'); setTimeout(() => document.getElementById('bug-modal').classList.add('hidden'), 300); };

// --- CAROUSEL & GRID LOGIC (Paste your existing SpotLight & RenderGrid functions here to keep your layout perfect) ---
// Note: Keep your existing initSpotlight, renderGrid, and buildMiniList functions here below this line.
