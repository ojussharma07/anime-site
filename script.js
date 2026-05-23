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
    const genreList = document.getElementById("genre-list");

    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';

    // Build the A-Z Index Bar
    const letters = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    letters.forEach(letter => {
        const btn = document.createElement("button");
        btn.textContent = letter;
        // Styling matches the pink/red hover effect from your screenshot
        btn.className = "px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition duration-200";
        
        btn.addEventListener("click", () => {
            // Reset colors
            Array.from(alphaIndex.children).forEach(c => c.className = "px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition duration-200");
            btn.className = "px-3 py-1.5 rounded bg-rose-600 border border-rose-600 text-white transition duration-200"; // Active state
            
            if (letter === 'All') {
                loadTopAnime();
            } else {
                fetchByLetter(letter === '#' ? '1' : letter); // Use '1' to trick Jikan into returning numbers for '#'
            }
        });
        alphaIndex.appendChild(btn);
    });

    // Build the Genre Buttons (Common Jikan Genre IDs)
    const genres = [
        { id: 1, name: "Action" }, { id: 2, name: "Adventure" }, { id: 4, name: "Comedy" },
        { id: 8, name: "Drama" }, { id: 10, name: "Fantasy" }, { id: 14, name: "Horror" },
        { id: 22, name: "Romance" }, { id: 24, name: "Sci-Fi" }, { id: 36, name: "Slice of Life" }
    ];
    genres.forEach(genre => {
        const btn = document.createElement("button");
        btn.textContent = genre.name;
        btn.className = "whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-indigo-600 hover:text-white transition duration-200 text-sm font-bold";
        
        btn.addEventListener("click", () => {
            Array.from(genreList.children).forEach(c => c.className = "whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-indigo-600 hover:text-white transition duration-200 text-sm font-bold");
            btn.className = "whitespace-nowrap px-4 py-2 rounded-full bg-indigo-600 border border-indigo-600 text-white transition duration-200 text-sm font-bold";
            fetchByGenre(genre.id, genre.name);
        });
        genreList.appendChild(btn);
    });

    // Reusable Grid Renderer
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

    // Default Load (Top Anime)
    function loadTopAnime() {
        gridHeader.textContent = "Trending Now";
        fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24")
            .then(res => res.json())
            .then(data => {
                const animeList = data.data;

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
                renderGrid(animeList);
            });
    }

    // Search Functions
    function executeSearch(query) {
        gridHeader.textContent = `Search Results: "${query}"`;
        animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Searching...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&sfw`)
            .then(res => res.json())
            .then(data => renderGrid(data.data));
    }

    function fetchByLetter(letter) {
        gridHeader.textContent = `Shows starting with "${letter}"`;
        animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?letter=${letter}&order_by=popularity&sort=asc&limit=24`)
            .then(res => res.json())
            .then(data => renderGrid(data.data));
    }

    function fetchByGenre(genreId, genreName) {
        gridHeader.textContent = `${genreName} Anime`;
        animeGrid.innerHTML = `<p class="text-zinc-500 col-span-full text-center py-10">Loading...</p>`;
        fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&sort=asc&limit=24`)
            .then(res => res.json())
            .then(data => renderGrid(data.data));
    }

    // Attach Listeners
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

    loadTopAnime();
});
