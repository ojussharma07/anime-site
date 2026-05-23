document.addEventListener("DOMContentLoaded", () => {
    const animeGrid = document.getElementById("anime-grid");
    const gridHeader = document.getElementById("grid-header");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const heroBanner = document.getElementById("hero-banner");
    const heroPlayBtn = document.getElementById("hero-play-btn");
    
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const alphaIndex = document.getElementById("alpha-index");

    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';

    // --- NEW: DYNAMIC HERO BANNER ENGINE ---
    // This takes the #1 anime from whatever list you just searched/clicked and makes it the spotlight
    function updateHeroBanner(anime) {
        if (!anime || !heroTitle) return;
        
        heroTitle.textContent = anime.title;
        if (heroDesc) heroDesc.textContent = anime.synopsis ? anime.synopsis : "No synopsis overview available.";
        
        const fallbackImg = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
        if (heroBanner && fallbackImg) {
            heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.6), rgba(9,9,11,0.2)), url('${fallbackImg}')`;
        }
        
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(anime.title)}`)
            .then(res => res.json())
            .then(tmdbSearch => {
                if (tmdbSearch.results && tmdbSearch.results.length > 0 && tmdbSearch.results[0].backdrop_path && heroBanner) {
                    const backdropUrl = `https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}`;
                    heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.6), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                }
            }).catch(() => console.log("TMDb BG skipped, using Jikan fallback"));

        if (heroPlayBtn) {
            heroPlayBtn.onclick = () => {
                const safeTitle = encodeURIComponent(anime.title || 'Unknown Title');
                const safeId = encodeURIComponent(anime.mal_id || '');
                const safeImg = encodeURIComponent(fallbackImg || '');
                window.location.href = `player.html?title=${safeTitle}&mal_id=${safeId}&img=${safeImg}`;
            };
        }
    }

    // 1. Build A-Z Dropdown
    if (alphaIndex) {
        const letters = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
        letters.forEach(letter => {
            const btn = document.createElement("button");
            btn.textContent = letter;
            const defaultClass = "w-8 h-8 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs hover:bg-rose-600 hover:text-white hover:border-rose-600 transition duration-200";
            const activeClass = "w-8 h-8 flex items-center justify-center rounded bg-rose-600 border border-rose-600 text-white text-xs transition duration-200";
            
            btn.className = letter === 'All' ? activeClass : defaultClass;
            
            btn.addEventListener("click", () => {
                Array.from(alphaIndex.children).forEach(c => c.className = defaultClass);
                btn.className = activeClass;
                
                if (letter === 'All') {
                    loadTopAnime();
                } else {
                    fetchByLetter(letter === '#' ? '1' : letter);
                }
                if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            alphaIndex.appendChild(btn);
        });
    }

    // 2. Render Grid
    function renderGrid(animeList) {
        if (!animeGrid) return;
        animeGrid.innerHTML = "";
        
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">No results found.</p>`;
            return;
        }

        animeList.forEach((anime) => {
            const wrapper = document.createElement("div");
            wrapper.className = "relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden border border-zinc-900 hover:border-zinc-700 transition duration-300";
            
            const coverImg = (anime.images && anime.images.jpg && anime.images.jpg.large_image_url) ? anime.images.jpg.large_image_url : '';
            
            wrapper.innerHTML = `
                <img src="${coverImg}" alt="${anime.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-3 opacity-90">
                    <h3 class="font-bold text-xs md:text-sm line-clamp-1 text-white">${anime.title}</h3>
                    <p class="text-[10px] text-zinc-400 mt-0.5">★ ${anime.score || 'N/A'} • ${anime.type}</p>
                </div>
            `;

            wrapper.addEventListener("click", () => {
                const safeTitle = encodeURIComponent(anime.title || 'Unknown Title');
                const safeId = encodeURIComponent(anime.mal_id || '');
                const safeImg = encodeURIComponent(coverImg);
                window.location.href = `player.html?title=${safeTitle}&mal_id=${safeId}&img=${safeImg}`;
            });

            animeGrid.appendChild(wrapper);
        });
    }

    // 3. API Fetchers
    function loadTopAnime() {
        if (gridHeader) gridHeader.textContent = "Trending Now";
        fetch("
