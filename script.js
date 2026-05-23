document.addEventListener("DOMContentLoaded", () => {
    const animeGrid = document.getElementById("anime-grid");
    const gridHeader = document.getElementById("grid-header");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const heroBanner = document.getElementById("hero-banner");
    const heroPlayBtn = document.getElementById("hero-play-btn");
    
    // Search Element Hooks
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");

    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';

    // 1. Reusable Grid Renderer (Builds cards for BOTH Top 10 and Search Results)
    function renderGrid(animeList) {
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

    // 2. Fetch Default Top 10 (Runs on initial page load)
    function loadTopAnime() {
        fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=12")
            .then(res => res.json())
            .then(data => {
                const animeList = data.data;

                // Build Spotlight Hero
                if (animeList.length > 0) {
                    const spotlight = animeList[0];
                    heroTitle.textContent = spotlight.title;
                    heroDesc.textContent = spotlight.synopsis || "No description overview listing indexed yet.";
                    
                    fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(spotlight.title)}`)
                        .then(res => res.json())
                        .then(tmdbSearch => {
                            if (tmdbSearch.results && tmdbSearch.results.length > 0 && tmdbSearch.results[0].backdrop_path) {
                                const backdropUrl = `https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}`;
                                heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.4), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                            }
                        });

                    heroPlayBtn.onclick = () => {
                        const safeTitle = encodeURIComponent(spotlight.title || 'Unknown Title');
                        const safeId = encodeURIComponent(spotlight.mal_id || '');
                        const safeImg = encodeURIComponent((spotlight.images && spotlight.images.jpg && spotlight.images.jpg.large_image_url) ? spotlight.images.jpg.large_image_url : '');
                        window.location.href = `player.html?title=${safeTitle}&mal_id=${safeId}&img=${safeImg}`;
                    };
                }

                gridHeader.textContent = "Trending Now";
                renderGrid(animeList);
            })
            .catch(err => console.error(err));
    }

    // 3. Search Engine Query
    function executeSearch(query) {
        gridHeader.textContent = `Search Results: "${query}"`;
        animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Searching the database...</p>`;
        
        // Asks Jikan for up to 24 exact matches to the user's search
        fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&sfw`)
            .then(res => res.json())
            .then(data => {
                renderGrid(data.data);
                // Scroll the page down to the grid results automatically
                gridHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            })
            .catch(err => console.error("Search Error:", err));
    }

    // 4. Attach Listeners
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

    // Boot up the page
    loadTopAnime();
});
