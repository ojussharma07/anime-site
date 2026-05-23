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
                gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24")
            .then(res => {
                if (!res.ok) throw new Error("API Rate Limited");
                return res.json();
            })
            .then(data => {
                if (!data || !data.data) throw new Error("No data returned");
                const animeList = data.data;

                if (animeList.length > 0 && heroTitle) {
                    const spotlight = animeList[0];
                    heroTitle.textContent = spotlight.title;
                    if (heroDesc) heroDesc.textContent = spotlight.synopsis || "No description overview listing indexed yet.";
                    
                    fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(spotlight.title)}`)
                        .then(res => res.json())
                        .then(tmdbSearch => {
                            if (tmdbSearch.results && tmdbSearch.results.length > 0 && tmdbSearch.results[0].backdrop_path && heroBanner) {
                                const backdropUrl = `https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}`;
                                heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.4), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                            }
                        }).catch(() => console.log("TMDb BG skipped"));

                    if (heroPlayBtn) {
                        heroPlayBtn.onclick = () => {
                            const safeTitle = encodeURIComponent(spotlight.title || 'Unknown Title');
                            const safeId = encodeURIComponent(spotlight.mal_id || '');
                            const safeImg = encodeURIComponent((spotlight.images && spotlight.images.jpg && spotlight.images.jpg.large_image_url) ? spotlight.images.jpg.large_image_url : '');
                            window.location.href = `player.html?title=${safeTitle}&mal_id=${safeId}&img=${safeImg}`;
                        };
                    }
                }
                renderGrid(animeList);
            })
            .catch(err => {
                if (heroTitle) heroTitle.textContent = "Database Offline";
                if (heroDesc) heroDesc.textContent = "Jikan API rate limit reached. Please wait a few seconds and refresh.";
                if (animeGrid) animeGrid.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">Rate limit exceeded. Please refresh the page.</p>`;
            });
    }

    function executeSearch(query) {
        if (gridHeader) gridHeader.textContent = `Search Results: "${query}"`;
        if (searchInput) searchInput.value = query;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Searching...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&sfw`)
            .then(res => res.json())
            .then(data => {
                renderGrid(data?.data || []);
                if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
    }

    function fetchByLetter(letter) {
        if (gridHeader) gridHeader.textContent = `Shows starting with "${letter === '1' ? '#' : letter}"`;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?letter=${letter}&order_by=popularity&sort=asc&limit=24`)
            .then(res => res.json())
            .then(data => renderGrid(data?.data || []));
    }

    function fetchByGenre(genreId, genreName) {
        if (gridHeader) gridHeader.textContent = `${genreName} Anime`;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&sort=asc&limit=24`)
            .then(res => res.json())
            .then(data => renderGrid(data?.data || []));
    }

    function fetchSpecialView(title, url) {
        if (gridHeader) gridHeader.textContent = title;
        if (animeGrid) animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                renderGrid(data?.data || []);
                if (gridHeader) gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            })
            .catch(err => {
                if (animeGrid) animeGrid.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">Rate limit exceeded. Please refresh.</p>`;
            });
    }

    // 4. Attach General Listeners
    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            const query = searchInput.value.trim();
            if (query) executeSearch(query);
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = searchInput.value.trim();
                if (query) executeSearch(query);
            }
        });
    }

    // 5. INITIALIZATION LOGIC
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const viewQuery = urlParams.get('view');
    const genreIdQuery = urlParams.get('genre_id');
    const genreNameQuery = urlParams.get('genre_name');

    if (searchQuery) {
        executeSearch(searchQuery);
        fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=1").then(res => res.json()).then(data => {
            if(data.data && data.data[0] && heroTitle && heroDesc) {
                heroTitle.textContent = data.data[0].title;
                heroDesc.textContent = data.data[0].synopsis;
            }
        });
    } else if (genreIdQuery && genreNameQuery) {
        fetchByGenre(genreIdQuery, genreNameQuery.replace(/_/g, ' '));
    } else if (viewQuery === 'ongoing') {
        fetchSpecialView("Ongoing Anime", "https://api.jikan.moe/v4/seasons/now?limit=24");
    } else if (viewQuery === 'upcoming') {
        fetchSpecialView("New Releases", "https://api.jikan.moe/v4/seasons/upcoming?limit=24");
    } else if (viewQuery === 'movies') {
        fetchSpecialView("Anime Movies", "https://api.jikan.moe/v4/anime?type=movie&order_by=popularity&sort=asc&limit=24");
    } else if (viewQuery === 'recent') {
        fetchSpecialView("Recently Updated", "https://api.jikan.moe/v4/seasons/now?limit=24");
    } else if (viewQuery === 'shuffle') {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        fetchSpecialView("Random Selection", `https://api.jikan.moe/v4/top/anime?limit=24&page=${randomPage}`);
    } else {
        loadTopAnime();
    }
});
