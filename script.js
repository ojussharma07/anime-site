document.addEventListener("DOMContentLoaded", () => {
    // --- ACTIVE NAV TEXT (CRASH-PROOFED) ---
    try {
        const navLinks = document.querySelectorAll('.nav-link, nav button'); 
        const currentUrl = window.location.href;

        navLinks.forEach(link => {
            link.classList.remove('text-indigo-400', 'font-black', 'drop-shadow-md');
            
            if (link.href) {
                if (link.href === currentUrl || (currentUrl.includes('?') && link.href.includes(window.location.search))) {
                    link.classList.remove('text-zinc-400');
                    link.classList.add('text-indigo-400', 'font-black', 'drop-shadow-md');
                }
            } 
            else if (link.textContent) {
                const text = link.textContent.toUpperCase();
                if ((currentUrl.includes('type=') && text.includes('TYPES')) || 
                    (currentUrl.includes('letter=') && text.includes('A-Z'))) {
                    link.classList.remove('text-zinc-400', 'hover:text-white');
                    link.classList.add('text-indigo-400', 'font-black', 'drop-shadow-md');
                }
            }
        });
    } catch (error) {
        console.warn("Navigation highlighting skipped to prevent crash:", error);
    }

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
    let currentApiUrl = "";

    // --- SPOTLIGHT CAROUSEL ENGINE ---
    let spotlightData = [];
    let currentSpotlightIndex = 0;
    let spotlightInterval = null;

    function initSpotlight(animeList) {
        if (!animeList || animeList.length === 0) return;
        
        // Grab the top 5 anime for the carousel (or however many are available)
        spotlightData = animeList.slice(0, 5);
        currentSpotlightIndex = 0;
        
        renderSpotlight();
        
        // Auto-rotate every 7 seconds
        if (spotlightInterval) clearInterval(spotlightInterval);
        spotlightInterval = setInterval(() => {
            currentSpotlightIndex = (currentSpotlightIndex + 1) % spotlightData.length;
            renderSpotlight();
        }, 7000);
    }

    function renderSpotlight() {
        const anime = spotlightData[currentSpotlightIndex];
        if (!anime || !heroTitle) return;
        
        // Update Text & Rank
        const rankDisplay = document.getElementById("spotlight-rank");
        if (rankDisplay) {
            rankDisplay.innerHTML = `<span class="text-3xl text-white">#${currentSpotlightIndex + 1}</span> <span class="pt-1">SPOTLIGHT</span>`;
        }
        
        heroTitle.textContent = anime.title;
        
        if (heroDesc) {
            let desc = anime.synopsis || anime.background || "No synopsis overview available yet.";
            desc = desc.replace(/\[Written by MAL Rewrite\]/gi, '').trim();
            if (desc.length > 200) desc = desc.substring(0, 200).trim() + "...";
            heroDesc.textContent = desc;
        }
        
        // Update Background Image
        const fallbackImg = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
        if (heroBanner && fallbackImg) {
            heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.8), rgba(9,9,11,0.2)), url('${fallbackImg}')`;
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
                    heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.8), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                }
            }).catch(() => {});

        // Build the 1-5 Control Cards
        const controls = document.getElementById("spotlight-controls");
        const mobileControls = document.getElementById("spotlight-controls-mobile");
        
        if (controls && mobileControls) {
            controls.innerHTML = "";
            mobileControls.innerHTML = "";
            
            spotlightData.forEach((item, index) => {
                const isActive = index === currentSpotlightIndex;
                
                // Desktop 1-5 Card
                const btn = document.createElement("div");
                btn.className = `cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-500 w-16 h-24 relative flex items-center justify-center group ${isActive ? 'border-indigo-500 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10' : 'border-zinc-800 opacity-50 hover:opacity-100 hover:border-zinc-500'}`;
                
                const img = item.images?.jpg?.image_url || '';
                btn.innerHTML = `
                    <div class="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300 z-10 ${isActive ? '!bg-black/20' : ''}"></div>
                    <img src="${img}" class="absolute inset-0 w-full h-full object-cover z-0">
                    <span class="relative z-20 font-black text-3xl text-white drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">${index + 1}</span>
                `;
                
                btn.onclick = () => {
                    currentSpotlightIndex = index;
                    renderSpotlight();
                    // Reset timer on manual click
                    clearInterval(spotlightInterval);
                    spotlightInterval = setInterval(() => {
                        currentSpotlightIndex = (currentSpotlightIndex + 1) % spotlightData.length;
                        renderSpotlight();
                    }, 7000);
                };
                controls.appendChild(btn);

                // Mobile Dot
                const dot = document.createElement("div");
                dot.className = `w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${isActive ? 'bg-indigo-500 w-8' : 'bg-zinc-600'}`;
                dot.onclick = btn.onclick; // Link dot to same function
                mobileControls.appendChild(dot);
            });
        }
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

    // --- MAIN GRID RENDERER ---
    function renderGrid(animeList) {
        if (!animeGrid) return;
        animeGrid.innerHTML = "";
        
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">No results found.</p>`;
            return;
        }

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

        if (currentPage > 1) {
            html += `<button onclick="goToPage(1)" class="${btnInactive}">«</button>`;
            html += `<button onclick="goToPage(${currentPage - 1})" class="${btnInactive}">‹</button>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) html += `<button class="${btnActive}">${i}</button>`;
            else html += `<button onclick="goToPage(${i})" class="${btnInactive}">${i}</button>`;
        }
        if (currentPage < lastPage) {
            html += `<button onclick="goToPage(${currentPage + 1})" class="${btnInactive}">›</button>`;
            html += `<button onclick="goToPage(${lastPage})" class="${btnInactive}">»</button>`;
        }
        paginationContainer.innerHTML = html;
    }

    window.goToPage = function(page) { fetchAnimeData(currentApiUrl, page); };

    // --- MASTER API FETCHER ---
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
                
                if (page === 1 && list.length > 0) {
                    initSpotlight(list); // PASSES THE LIST TO SPOTLIGHT GENERATOR
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
        fetchAnimeData(url, 1);
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", (e) => { e.preventDefault(); executeAdvancedSearch(); });
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") { e.preventDefault(); executeAdvancedSearch(); }
        });
    }
    const filterBtn = document.getElementById('apply-filters-btn');
    if (filterBtn) filterBtn.addEventListener("click", (e) => { e.preventDefault(); executeAdvancedSearch(); });

    // --- MINI COLUMNS ---
    function buildMiniList(url, containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        fetch(url).then(res => res.json()).then(data => {
            const uniqueList = (data.data || []).filter((anime, index, self) =>
                index === self.findIndex((t) => t.mal_id === anime.mal_id)
            );
            
            const list = uniqueList.slice(0, 5); 
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
    const typeQuery = urlParams.get('type');
    const genreIdQuery = urlParams.get('genre_id');
    const genreNameQuery = urlParams.get('genre_name');
    const letterQuery = urlParams.get('letter');

    if (searchQuery) {
        executeAdvancedSearch(searchQuery);
    } else if (letterQuery) {
        if (gridHeader) gridHeader.textContent = `Shows starting with "${letterQuery === '1' ? '#' : letterQuery}"`;
        fetchAnimeData(`https://api.jikan.moe/v4/anime?letter=${letterQuery}&order_by=popularity&sort=asc&limit=24`);
    } else if (genreIdQuery && genreNameQuery) {
        if (gridHeader) gridHeader.textContent = `${genreNameQuery.replace(/_/g, ' ')} Anime`;
        fetchAnimeData(`https://api.jikan.moe/v4/anime?genres=${genreIdQuery}&order_by=popularity&sort=asc&limit=24`);
    } else if (typeQuery) {
        const typeLabels = { 'tv': 'TV Series', 'movie': 'Movies', 'ova': 'OVAs', 'special': 'Specials' };
        if (gridHeader) gridHeader.textContent = `Top ${typeLabels[typeQuery] || 'Anime'}`;
        fetchAnimeData(`https://api.jikan.moe/v4/anime?type=${typeQuery}&order_by=popularity&sort=desc&limit=24`);
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

    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/now?limit=5", "col-airing"), 1000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/upcoming?limit=5", "col-upcoming"), 2000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=5", "col-popular"), 3000);
});
