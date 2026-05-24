document.addEventListener("DOMContentLoaded", () => {
    // --- ACTIVE NAV TEXT ---
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
            } else if (link.textContent) {
                const text = link.textContent.toUpperCase();
                if ((currentUrl.includes('type=') && text.includes('TYPES')) || (currentUrl.includes('letter=') && text.includes('A-Z'))) {
                    link.classList.remove('text-zinc-400', 'hover:text-white');
                    link.classList.add('text-indigo-400', 'font-black', 'drop-shadow-md');
                }
            }
        });
    } catch (e) {}

    const animeGrid = document.getElementById("anime-grid");
    const gridHeader = document.getElementById("grid-header");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const heroBanner = document.getElementById("hero-banner");
    const heroPlayBtn = document.getElementById("hero-play-btn");
    const paginationContainer = document.getElementById("pagination-container");
    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';
    let currentApiUrl = "";

    // --- SPOTLIGHT CAROUSEL ---
    let spotlightData = [];
    let currentSpotlightIndex = 0;
    let spotlightInterval = null;

    function initSpotlight(animeList) {
        if (!animeList || animeList.length === 0) return;
        spotlightData = animeList.slice(0, 5);
        currentSpotlightIndex = 0;
        renderSpotlight();
        if (spotlightInterval) clearInterval(spotlightInterval);
        spotlightInterval = setInterval(() => {
            currentSpotlightIndex = (currentSpotlightIndex + 1) % spotlightData.length;
            renderSpotlight();
        }, 7000);
    }

    function renderSpotlight() {
        const anime = spotlightData[currentSpotlightIndex];
        if (!anime || !heroTitle) return;
        
        const rankDisplay = document.getElementById("spotlight-rank");
        if (rankDisplay) rankDisplay.innerHTML = `<span class="text-3xl text-white">#${currentSpotlightIndex + 1}</span> <span class="pt-1">SPOTLIGHT</span>`;
        
        heroTitle.textContent = anime.title;
        if (heroDesc) {
            let desc = anime.synopsis || anime.background || "No synopsis overview available yet.";
            heroDesc.textContent = desc.replace(/\[Written by MAL Rewrite\]/gi, '').trim().substring(0, 200) + "...";
        }
        
        const fallbackImg = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
        if (heroBanner && fallbackImg) heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.8), rgba(9,9,11,0.2)), url('${fallbackImg}')`;

        if (heroPlayBtn) {
            heroPlayBtn.classList.remove('hidden');
            heroPlayBtn.onclick = () => window.location.href = `info.html?id=${anime.mal_id}`;
        }
        
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(anime.title)}`)
            .then(res => res.json())
            .then(tmdbSearch => {
                if (tmdbSearch.results?.[0]?.backdrop_path && heroBanner) {
                    heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.8), rgba(9,9,11,0.2)), url('https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}')`;
                }
            }).catch(() => {});

        const controls = document.getElementById("spotlight-controls");
        const mobileControls = document.getElementById("spotlight-controls-mobile");
        if (controls && mobileControls) {
            controls.innerHTML = ""; mobileControls.innerHTML = "";
            spotlightData.forEach((item, index) => {
                const isActive = index === currentSpotlightIndex;
                const btn = document.createElement("div");
                btn.className = `cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-500 w-16 h-24 relative flex items-center justify-center group ${isActive ? 'border-indigo-500 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10' : 'border-zinc-800 opacity-50 hover:opacity-100'}`;
                btn.innerHTML = `
                    <div class="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 ${isActive ? '!bg-black/20' : ''}"></div>
                    <img src="${item.images?.jpg?.image_url || ''}" class="absolute inset-0 w-full h-full object-cover z-0">
                    <span class="relative z-20 font-black text-3xl text-white drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">${index + 1}</span>
                `;
                btn.onclick = () => {
                    currentSpotlightIndex = index; renderSpotlight();
                    clearInterval(spotlightInterval);
                    spotlightInterval = setInterval(() => { currentSpotlightIndex = (currentSpotlightIndex + 1) % spotlightData.length; renderSpotlight(); }, 7000);
                };
                controls.appendChild(btn);

                const dot = document.createElement("div");
                dot.className = `w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${isActive ? 'bg-indigo-500 w-8' : 'bg-zinc-600'}`;
                dot.onclick = btn.onclick;
                mobileControls.appendChild(dot);
            });
        }
    }

    // --- MAIN GRID RENDERER (GLASSMORPHISM UPGRADE) ---
    function renderGrid(animeList) {
        if (!animeGrid) return;
        animeGrid.innerHTML = "";
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">No results found.</p>`;
            return;
        }

        const uniqueAnimeList = animeList.filter((anime, index, self) => index === self.findIndex((t) => t.mal_id === anime.mal_id));

        uniqueAnimeList.forEach((anime) => {
            const wrapper = document.createElement("div");
            // Premium glow and hover scale
            wrapper.className = "relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-indigo-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:-translate-y-1";
            const coverImg = anime.images?.jpg?.large_image_url || '';
            let shortDesc = anime.synopsis ? anime.synopsis.substring(0, 80) + "..." : "No synopsis.";
            
            wrapper.innerHTML = `
                <img src="${coverImg}" alt="${anime.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                    <h3 class="font-bold text-xs md:text-sm line-clamp-1 text-white">${anime.title}</h3>
                    <p class="text-[10px] text-zinc-400 mt-0.5">★ ${anime.score || 'N/A'} • ${anime.type}</p>
                </div>
                
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 p-4 flex flex-col justify-end">
                    <h3 class="font-black text-white text-sm line-clamp-2 mb-1">${anime.title}</h3>
                    <p class="text-[10px] text-indigo-400 font-bold mb-2 tracking-wider uppercase">★ ${anime.score || 'N/A'} • ${anime.type}</p>
                    <p class="text-[10px] text-zinc-300 line-clamp-3 mb-3 leading-relaxed">${shortDesc}</p>
                    <div class="w-full bg-indigo-600/90 text-white text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        ▶ Play Now
                    </div>
                </div>
            `;
            wrapper.addEventListener("click", () => window.location.href = `info.html?id=${anime.mal_id}`);
            animeGrid.appendChild(wrapper);
        });
    }

    // --- CONTINUE WATCHING RENDERER ---
    function renderContinueWatching() {
        const cwSection = document.getElementById('continue-watching-section');
        const cwGrid = document.getElementById('cw-grid');
        if (!cwSection || !cwGrid) return;

        // Hide it if we are searching or on a specific page (keeps the dashboard clean)
        if (window.location.search && !window.location.search.includes('view=home')) return;

        const history = JSON.parse(localStorage.getItem('animeHistory') || '[]');
        if (history.length > 0) {
            cwSection.classList.remove('hidden');
            cwGrid.innerHTML = '';
            
            // Show up to 6 recent shows
            history.slice(0, 6).forEach(anime => {
                // Fake a random progress bar percentage for premium visual effect (60% to 95%)
                const progress = Math.floor(Math.random() * (95 - 60 + 1) + 60); 
                
                cwGrid.innerHTML += `
                    <div class="relative group cursor-pointer w-[240px] shrink-0 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]" onclick="window.location.href='info.html?id=${anime.mal_id}'">
                        <div class="aspect-video w-full relative">
                            <img src="${anime.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                                <div class="bg-white/20 backdrop-blur-md rounded-full p-3 shadow-lg">
                                    <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"></path></svg>
                                </div>
                            </div>
                            <div class="absolute bottom-0 left-0 w-full h-1 bg-zinc-800">
                                <div class="h-full bg-[#F05A3F]" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="p-3 bg-[#151518]">
                            <h3 class="font-bold text-xs text-white truncate">${anime.title}</h3>
                            <p class="text-[10px] text-zinc-500 mt-0.5">Ep ${Math.floor(Math.random() * 12) + 1} • ${24 - Math.floor((progress/100)*24)}m remaining</p>
                        </div>
                    </div>
                `;
            });
        }
    }

    // --- BENTO BOX DASHBOARD RENDERER ---
    function buildMiniList(url, containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        
        fetch(url).then(res => res.json()).then(data => {
            const uniqueList = (data.data || []).filter((anime, index, self) => index === self.findIndex((t) => t.mal_id === anime.mal_id));
            const list = uniqueList.slice(0, 5); 
            container.innerHTML = ""; 
            
            list.forEach((anime, index) => {
                const row = document.createElement("div");
                
                // Spot #1: The Feature Card layout
                if (index === 0) {
                    row.className = "relative rounded-xl overflow-hidden cursor-pointer group border border-zinc-800 hover:border-indigo-500 transition-all shadow-lg";
                    const bannerImg = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
                    row.innerHTML = `
                        <div class="w-full aspect-video relative">
                            <img src="${bannerImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-[#151518] via-black/40 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-4 w-full">
                                <div class="flex items-center gap-2 text-[10px] font-black text-indigo-400 mb-1 uppercase tracking-widest">
                                    ★ ${anime.score || 'N/A'} <span>•</span> #1 Trending
                                </div>
                                <h4 class="text-base font-black text-white line-clamp-1 group-hover:text-indigo-300 transition">${anime.title}</h4>
                            </div>
                        </div>
                    `;
                } 
                // Spots 2-5: Enhanced List View with Hover Actions
                else {
                    row.className = "flex items-center gap-4 bg-[#151518] p-2.5 rounded-xl cursor-pointer transition-all border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 group overflow-hidden relative";
                    row.innerHTML = `
                        <div class="w-12 h-16 rounded-md overflow-hidden shrink-0 shadow-md">
                            <img src="${anime.images?.jpg?.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300">
                        </div>
                        <div class="flex-1 overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                            <h4 class="text-sm font-bold text-zinc-200 group-hover:text-white truncate">${anime.title}</h4>
                            <div class="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                                <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">${anime.type || 'TV'}</span>
                                <span class="text-zinc-500">★ ${anime.score || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="absolute right-2 bottom-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
                            <div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition shadow-lg"><svg class="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"></path></svg></div>
                        </div>
                    `;
                }
                row.addEventListener("click", () => window.location.href = `info.html?id=${anime.mal_id}`);
                container.appendChild(row);
            });
        }).catch(() => container.innerHTML = `<p class="text-xs text-red-500 py-4 text-center">API Rate Limited.</p>`);
    }

    // --- MASTER FETCH & ROUTING ---
    function fetchAnimeData(baseApiUrl, page = 1) {
        currentApiUrl = baseApiUrl; 
        const separator = baseApiUrl.includes('?') ? '&' : '?';
        const finalUrl = `${baseApiUrl}${separator}page=${page}`;

        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10 font-bold tracking-widest uppercase">Loading Page ${page}...</p>`;
        
        fetch(finalUrl).then(res => res.ok ? res.json() : Promise.reject()).then(data => {
            const list = data?.data || [];
            if (page === 1 && list.length > 0) initSpotlight(list);
            renderGrid(list);
            renderPagination(data?.pagination, page);
        }).catch(() => {
            if (animeGrid) animeGrid.innerHTML = `<p class="text-red-500 col-span-full text-center py-10 font-bold">API Rate Limit Exceeded.</p>`;
        });
    }

    function executeAdvancedSearch(baseQuery = null) {
        const searchVal = document.getElementById("search-input")?.value.trim();
        const query = baseQuery || searchVal;
        const typeEl = document.getElementById('filter-type');
        const genreEl = document.getElementById('filter-genre');
        let url = `https://api.jikan.moe/v4/anime?limit=24&sfw`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (typeEl?.value) url += `&type=${typeEl.value}`;
        if (genreEl?.value) url += `&genres=${genreEl.value}`;
        if (gridHeader) gridHeader.textContent = query ? `Search: "${query}"` : "Filtered Results";
        fetchAnimeData(url, 1);
    }

    document.getElementById("search-btn")?.addEventListener("click", (e) => { e.preventDefault(); executeAdvancedSearch(); });
    document.getElementById("search-input")?.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); executeAdvancedSearch(); } });
    document.getElementById('apply-filters-btn')?.addEventListener("click", (e) => { e.preventDefault(); executeAdvancedSearch(); });

    function renderPagination(paginationData, currentPage) {
        if (!paginationContainer || !paginationData?.last_visible_page || paginationData.last_visible_page <= 1) return paginationContainer.innerHTML = "";
        let html = "", btnBase = "w-11 h-11 flex items-center justify-center rounded-xl font-bold text-sm cursor-pointer", btnActive = `${btnBase} bg-[#F05A3F] text-white shadow-lg`, btnInactive = `${btnBase} bg-[#151518] border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white`;
        let startPage = Math.max(1, currentPage - 2), endPage = Math.min(paginationData.last_visible_page, currentPage + 2);
        if (currentPage <= 2) endPage = Math.min(5, paginationData.last_visible_page);
        for (let i = startPage; i <= endPage; i++) html += `<button onclick="window.goToPage(${i})" class="${i === currentPage ? btnActive : btnInactive}">${i}</button>`;
        paginationContainer.innerHTML = html;
    }
    window.goToPage = function(page) { fetchAnimeData(currentApiUrl, page); };

    // --- INITIALIZATION ---
    renderContinueWatching();
    
    const urlParams = new URLSearchParams(window.location.search);
    const params = { q: urlParams.get('q'), view: urlParams.get('view'), type: urlParams.get('type'), genreId: urlParams.get('genre_id'), letter: urlParams.get('letter') };

    if (params.q) executeAdvancedSearch(params.q);
    else if (params.letter) { gridHeader.textContent = `Starts with "${params.letter === '1' ? '#' : params.letter}"`; fetchAnimeData(`https://api.jikan.moe/v4/anime?letter=${params.letter}&order_by=popularity&sort=asc&limit=24`); }
    else if (params.genreId) { gridHeader.textContent = `Genre Results`; fetchAnimeData(`https://api.jikan.moe/v4/anime?genres=${params.genreId}&order_by=popularity&sort=asc&limit=24`); }
    else if (params.type) { gridHeader.textContent = `Top ${params.type.toUpperCase()}`; fetchAnimeData(`https://api.jikan.moe/v4/anime?type=${params.type}&order_by=popularity&sort=desc&limit=24`); }
    else if (params.view === 'new') { gridHeader.textContent = "Newly Released"; fetchAnimeData("https://api.jikan.moe/v4/seasons/now?limit=24"); }
    else if (params.view === 'upcoming') { gridHeader.textContent = "Upcoming Releases"; fetchAnimeData("https://api.jikan.moe/v4/seasons/upcoming?limit=24"); }
    else { gridHeader.textContent = "Trending Now"; fetchAnimeData("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24"); }

    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/now?limit=5", "col-airing"), 1000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/seasons/upcoming?limit=5", "col-upcoming"), 2000);
    setTimeout(() => buildMiniList("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=5", "col-popular"), 3000);
});
