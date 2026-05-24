document.addEventListener("DOMContentLoaded", () => {
    // --- ACTIVE NAV TEXT ---
    // Automatically highlights the current page in the navigation bar
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
    const paginationContainer = document.getElementById("pagination-container");

    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';
    
    // Global variable to track the current API request for pagination
    let currentApiUrl = "";

    // --- HERO BANNER ENGINE ---
    function updateHeroBanner(anime) {
        if (!anime || !heroTitle) return;
        
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

        if (heroPlayBtn) {
            heroPlayBtn.classList.remove('hidden');
            heroPlayBtn.onclick = () => window.location.href = `info.html?id=${anime.mal_id}`;
        }
        
        // Fetch HD Backdrop from TMDB
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(anime.title)}`)
            .then(res => res.json())
            .then(tmdbSearch => {
                if (tmdbSearch.results && tmdbSearch.results.length > 0 && tmdbSearch.results[0].backdrop_path && heroBanner) {
                    const backdropUrl = `https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}`;
                    heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.6), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                }
            }).catch(() => {});
    }

    // --- A-Z LIST GENERATOR ---
    if (alphaIndex) {
        const letters = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
        letters.forEach(letter => {
            const btn = document.createElement("button");
            btn.textContent = letter;
            const defaultClass = "w-8 h-8 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs hover:bg-rose-600 hover:text-white hover:border-rose-600 transition duration-200 cursor-pointer";
            const activeClass = "w-8 h-8 flex items-center justify-center rounded bg-rose-600 border border-rose-600 text-white text-xs transition duration-200 cursor-pointer";
            btn.className = letter === 'All' ? activeClass : defaultClass;
            
            btn.addEventListener("click", () => {
                if (!animeGrid) {
                    // Redirect to home if used on landing page or history page
                    window.location.href = `home.html?letter=${letter === '#' ? '1' : letter}`;
                    return;
                }
                
                Array.from(alphaIndex.children).forEach(c => c.className = defaultClass);
                btn.className = activeClass;
                
                if (letter === 'All') {
                    if (gridHeader) gridHeader.textContent = "Trending Now";
                    fetchAnimeData("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24");
                } else {
                    if (gridHeader) gridHeader.textContent = `Shows starting with "${letter === '1' ? '#' : letter}"`;
                    fetchAnimeData(`https://api.jikan.moe/v4/anime?letter=${letter === '#' ? '1' : letter}&order_by=popularity&sort=asc&limit=24`);
                }
            });
            alphaIndex.appendChild(btn);
        });
    }

    // --- MAIN GRID RENDERER (With Duplicate Fix) ---
    function renderGrid(animeList) {
        if (!animeGrid) return;
        animeGrid.innerHTML = "";
        
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">No results found.</p>`;
            return;
        }

        // NEW: Filter out duplicate anime IDs that the API sometimes returns by mistake
        const uniqueAnimeList = animeList.filter((anime, index, self) =>
            index === self.findIndex((t) => t.mal_id === anime.mal_id)
        );

        uniqueAnimeList.forEach((anime) => {
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

    // --- PAGINATION RENDERER ---
    function renderPagination(paginationData, currentPage) {
        if (!paginationContainer) return;
        if (!paginationData || !paginationData.last_visible_page || paginationData.last_visible_page <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        const lastPage = paginationData.last_visible_page;
        let html = "";

        const btnBase = "w-11 h-11 flex items-center justify-center rounded-xl font-bold text-sm transition duration-200 cursor-pointer";
        const btnActive = `${btnBase} bg-[#F05A3F] text-white shadow-lg`; 
        const btnInactive = `${btnBase} bg-[#151518] border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white`;

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(lastPage, currentPage + 2);
        
        if (currentPage <= 2) endPage = Math.min(5, lastPage);
        if (currentPage >= lastPage - 1) startPage = Math.max(1, lastPage - 4);

        // First / Prev
        if (currentPage > 1) {
            html += `<button onclick="goToPage(1)" class="${btnInactive}">«</button>`;
            html += `<button onclick="goToPage(${currentPage - 1})" class="${btnInactive}">‹</button>`;
        }

        // Numbers
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="${btnActive}">${i}</button>`;
            } else {
                html += `<button onclick="goToPage(${i})" class="${btnInactive}">${i}</button>`;
            }
        }

        // Next / Last
        if (currentPage < lastPage) {
            html += `<button onclick="goToPage(${currentPage + 1})" class="${btnInactive}">›</button>`;
            html += `<button onclick="goToPage(${lastPage})" class="${btnInactive}">»</button>`;
        }

        paginationContainer.innerHTML = html;
    }

    // Global jump function for pagination
    window.goToPage = function(page) {
        fetchAnimeData(currentApiUrl, page);
    };

    // --- MASTER API FETCHER ---
    // Centralized fetcher that handles pagination, grid rendering, and rate-limit recovery
    function fetchAnimeData(baseApiUrl, page = 1) {
        currentApiUrl = baseApiUrl; 
        
        const separator = baseApiUrl.includes('?') ? '&' : '?';
        const finalUrl = `${baseApiUrl}${separator}page=${page}`;

        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10 font-bold tracking-widest uppercase">Loading Page ${page}...</p>`;
        if (paginationContainer) paginationContainer.innerHTML = "";
        
        fetch(finalUrl)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                const list = data?.data || [];
                
                // Update Hero banner only if we are on page 1
                if (page === 1 && list.length > 0) {
                    updateHeroBanner(list[0]);
                } else if (list.length === 0 && page === 1) {
                    if (heroTitle) heroTitle.textContent = "No Results Found";
                    if (heroDesc) heroDesc.textContent = "Try adjusting your search or filters.";
                }

                renderGrid(list);
                renderPagination(data?.pagination, page);
                
                if (gridHeader && page > 1) {
                    const y = gridHeader.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }
            })
            .catch(() => {
                if (animeGrid) animeGrid.innerHTML = `<p class="text-red-500 col-span-full text-center py-10 font-bold">API Rate Limit Exceeded. Please wait a few seconds and refresh.</p>`;
            });
    }

    // --- SEARCH & FILTER LOGIC ---
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
        
        // Pass to the Master Fetcher (Starting at Page 1)
        fetchAnimeData(url, 1);
    }

    // Attach Search Events
    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", (e) => { e.preventDefault(); executeAdvancedSearch(); });
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") { e.preventDefault(); executeAdvancedSearch(); }
        });
    }
    
    // Attach Apply Filters Event
    const filterBtn = document.getElementById('apply-filters-btn');
    if (filterBtn) filterBtn.addEventListener("click", (e) => {
        e.preventDefault(); 
        executeAdvancedSearch();
    });

    // --- MINI COLUMNS (For Home Page Dashboard) ---
    function buildMiniList(url, containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        fetch(url).then(res => res.json()).then(data => {
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
        }).catch(() => container.innerHTML = `<p class="text-xs text-red-500 py-4 text-center">API Rate Limited.</p>`);
    }

    // --- INITIALIZATION ROUTER ---
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const viewQuery = urlParams.get('view');
    const genreIdQuery = urlParams.get('genre_id');
    const genreNameQuery = urlParams.get('genre_name');
    const letterQuery = urlParams.get('letter');

    // 1. Process URL commands to load the correct grid data
    if (searchQuery) {
        executeAdvancedSearch(searchQuery);
    } else if (letterQuery) {
        if (gridHeader) gridHeader.textContent = `Shows starting with "${letterQuery === '1' ? '#' : letterQuery}"`;
        fetchAnimeData(`https://api.jikan.moe/v4/anime?letter=${letterQuery}&order_by=popularity&sort=asc&limit=24`);
    } else if (genreIdQuery && genreNameQuery) {
        if (gridHeader) gridHeader.textContent = `${genreNameQuery.replace(/_/g, ' ')} Anime`;
        fetchAnimeData(`https://api.jikan.moe/v4/anime?genres=${genreIdQuery}&order_by=popularity&sort=asc&limit=24`);
    } else if (viewQuery === 'new') {
        if (gridHeader) gridHeader.textContent = "Newly Released";
        fetchAnimeData("https://api.jikan.moe/v4/seasons/now?limit=24");
    } else if (viewQuery === 'ongoing') {
        if (gridHeader) gridHeader.textContent = "Top Ongoing Anime";
        fetchAnimeData("https://api.jikan.moe/v4/anime?status=airing&order_by=score&sort=desc&limit=24");
    } else if (viewQuery === 'upcoming') {
        if (gridHeader) gridHeader.textContent = "Upcoming Releases";
        fetchAnimeData("https://api.jikan.moe/v4/seasons/upcoming?limit=24");
    } else if (viewQuery === 'movies') {
        if (gridHeader) gridHeader.textContent = "Anime Movies";
        fetchAnimeData("https://api.jikan.moe/v4/anime?type=movie&order_by=popularity&sort=desc&limit=24");
    } else if (viewQuery === 'shuffle') {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        if (gridHeader) gridHeader.textContent = "Random Selection";
        fetchAnimeData(`https://api.jikan.moe/v4/top/anime?limit=24`, randomPage); 
    } else {
        if (gridHeader) gridHeader.textContent = "Trending Now";
        fetchAnimeData("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24");
    }

    // 2. Load the 3 Bottom Columns (Staggered timers to prevent API blocks)
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/now?limit=5", "col-airing"), 1000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/upcoming?limit=5", "col-upcoming"), 2000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=5", "col-popular"), 3000);
});
