document.addEventListener("DOMContentLoaded", () => {
    // --- DYNAMIC ACTIVE NAV TEXT ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.href === window.location.href || (window.location.href.includes('?') && link.href.includes(window.location.search))) {
            link.classList.remove('text-zinc-400');
            link.classList.add('text-indigo-400', 'font-black', 'drop-shadow-md');
        }
    });

    // --- ELEMENT SELECTORS ---
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

    // --- DYNAMIC HERO BANNER ENGINE ---
    function updateHeroBanner(anime) {
        if (!anime) {
            loadTopAnime();
            return;
        }
        if (!heroTitle) return;
        
        heroTitle.textContent = anime.title;
        
        if (heroDesc) {
            let desc = anime.synopsis ? anime.synopsis : "No synopsis overview available.";
            desc = desc.replace(/\[Written by MAL Rewrite\]/gi, '').trim();
            if (desc.length > 200) desc = desc.substring(0, 200).trim() + "...";
            heroDesc.textContent = desc;
        }
        
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
            }).catch(() => {});

        if (heroPlayBtn) {
            heroPlayBtn.onclick = () => window.location.href = `info.html?id=${anime.mal_id}`;
        }
    }

    // --- A-Z DROPDOWN BUILDER ---
    if (alphaIndex) {
        const letters = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
        letters.forEach(letter => {
            const btn = document.createElement("button");
            btn.textContent = letter;
            const defaultClass = "w-8 h-8 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs hover:bg-rose-600 hover:text-white hover:border-rose-600 transition duration-200";
            const activeClass = "w-8 h-8 flex items-center justify-center rounded bg-rose-600 border border-rose-600 text-white text-xs transition duration-200";
            btn.className = letter === 'All' ? activeClass : defaultClass;
            
            btn.addEventListener("click", () => {
                // If not on a grid page, redirect to home with the letter
                if (!animeGrid) {
                    window.location.href = `home.html?letter=${letter === '#' ? '1' : letter}`;
                    return;
                }
                
                Array.from(alphaIndex.children).forEach(c => c.className = defaultClass);
                btn.className = activeClass;
                
                if (letter === 'All') loadTopAnime();
                else fetchByLetter(letter === '#' ? '1' : letter);
                
                if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            alphaIndex.appendChild(btn);
        });
    }

    // --- MAIN GRID RENDERER ---
    function renderGrid(animeList) {
        if (!animeGrid) return;
        animeGrid.innerHTML = "";
        
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">No results found.</p>`;
            return;
        }

        animeList.forEach((anime) => {
            const wrapper = document.createElement("div");
            wrapper.className = "relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden border border-zinc-900 hover:border-zinc-700 transition duration-300 shadow-lg";
            const coverImg = (anime.images && anime.images.jpg && anime.images.jpg.large_image_url) ? anime.images.jpg.large_image_url : '';
            
            wrapper.innerHTML = `
                <img src="${coverImg}" alt="${anime.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-3 opacity-90">
                    <h3 class="font-bold text-xs md:text-sm line-clamp-1 text-white">${anime.title}</h3>
                    <p class="text-[10px] text-zinc-400 mt-0.5">★ ${anime.score || 'N/A'} • ${anime.type}</p>
                </div>
            `;
            wrapper.addEventListener("click", () => window.location.href = `info.html?id=${anime.mal_id}`);
            animeGrid.appendChild(wrapper);
        });
    }

    // --- MINI COLUMN RENDERER (For Home Page Bottom Lists) ---
    function buildMiniList(url, containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const list = data.data.slice(0, 5); 
                container.innerHTML = ""; 
                
                list.forEach(anime => {
                    const row = document.createElement("div");
                    row.className = "flex items-center gap-4 bg-zinc-900/30 hover:bg-zinc-800/80 p-2.5 rounded-xl cursor-pointer transition border border-transparent hover:border-zinc-700 group";
                    const coverImg = anime.images?.jpg?.image_url || '';
                    
                    row.innerHTML = `
                        <div class="w-12 h-16 rounded-md overflow-hidden shrink-0 shadow-md">
                            <img src="${coverImg}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300">
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <h4 class="text-sm font-bold text-zinc-200 group-hover:text-white truncate">${anime.title}</h4>
                            <div class="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                                <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">${anime.type || 'TV'}</span>
                                <span class="bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">★ ${anime.score || 'N/A'}</span>
                            </div>
                        </div>
                    `;
                    row.addEventListener("click", () => window.location.href = `info.html?id=${anime.mal_id}`);
                    container.appendChild(row);
                });
            })
            .catch(() => container.innerHTML = `<p class="text-xs text-red-500 py-4">Failed to load.</p>`);
    }

    // --- API FETCHERS ---
    function loadTopAnime() {
        if (gridHeader) gridHeader.textContent = "Trending Now";
        fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24")
            .then(res => res.ok ? res.json() : Promise.reject("Rate Limited"))
            .then(data => {
                const animeList = data?.data || [];
                if (animeList.length > 0) updateHeroBanner(animeList[0]);
                renderGrid(animeList);
            })
            .catch(() => {
                if (heroTitle) heroTitle.textContent = "Database Offline";
                if (heroDesc) heroDesc.textContent = "Rate limit reached. Please refresh.";
            });
    }

    function executeAdvancedSearch(baseQuery = null) {
        const searchVal = searchInput ? searchInput.value.trim() : "";
        const query = baseQuery || searchVal;
        
        const typeEl = document.getElementById('filter-type');
        const genreEl = document.getElementById('filter-genre');
        const statusEl = document.getElementById('filter-status');
        const sortEl = document.getElementById('filter-sort');

        let url = `https://api.jikan.moe/v4/anime?limit=24&sfw`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (typeEl && typeEl.value) url += `&type=${typeEl.value}`;
        if (genreEl && genreEl.value) url += `&genres=${genreEl.value}`;
        if (statusEl && statusEl.value) url += `&status=${statusEl.value}`;
        if (sortEl && sortEl.value) url += `&order_by=${sortEl.value}&sort=desc`;

        if (gridHeader) gridHeader.textContent = query ? `Search: "${query}"` : "Filtered Results";
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Searching...</p>`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const list = data?.data || [];
                if (list.length > 0) updateHeroBanner(list[0]);
                renderGrid(list);
                if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
    }

    function fetchByLetter(letter) {
        if (gridHeader) gridHeader.textContent = `Shows starting with "${letter === '1' ? '#' : letter}"`;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?letter=${letter}&order_by=popularity&sort=asc&limit=24`)
            .then(res => res.json())
            .then(data => {
                const list = data?.data || [];
                if (list.length > 0) updateHeroBanner(list[0]);
                renderGrid(list);
            });
    }

    function fetchSpecialView(title, url) {
        if (gridHeader) gridHeader.textContent = title;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const list = data?.data || [];
                if (list.length > 0) updateHeroBanner(list[0]);
                renderGrid(list);
            });
    }

    // --- EVENT LISTENERS ---
    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => executeAdvancedSearch());
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") executeAdvancedSearch();
        });
    }
    const filterBtn = document.getElementById('apply-filters-btn');
    if (filterBtn) filterBtn.addEventListener("click", () => executeAdvancedSearch());

    // --- BULLETPROOF INITIALIZATION LOGIC ---
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const viewQuery = urlParams.get('view');
    const genreIdQuery = urlParams.get('genre_id');
    const genreNameQuery = urlParams.get('genre_name');
    const letterQuery = urlParams.get('letter');

    // Force a default banner load if nothing is happening
    const fetchAndSetBanner = (url) => {
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const list = data?.data || [];
                if (list.length >
