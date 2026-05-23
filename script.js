document.addEventListener("DOMContentLoaded", () => {
    const animeGrid = document.getElementById("anime-grid");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const heroBanner = document.getElementById("hero-banner");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    // PLUGGED IN YOUR TMDB API KEY HERE
    const TMDB_API_KEY = '9d2f021af5279eb029c4eb58a080dbd3';

    fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10")
        .then(response => response.json())
        .then(data => {
            animeGrid.innerHTML = "";
            const animeList = data.data;

            if(animeList.length > 0) {
                const spotlight = animeList[0];
                heroTitle.textContent = spotlight.title;
                heroDesc.textContent = spotlight.synopsis || "No description overview listing indexed yet.";
                
                // Fetch high-res backdrop wallpaper using TMDb Search
                fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(spotlight.title)}`)
                    .then(res => res.json())
                    .then(tmdbSearch => {
                        if (tmdbSearch.results && tmdbSearch.results.length > 0 && tmdbSearch.results[0].backdrop_path) {
                            const backdropUrl = `https://image.tmdb.org/t/p/original${tmdbSearch.results[0].backdrop_path}`;
                            heroBanner.style.backgroundImage = `linear-gradient(to top, #09090b, rgba(9,9,11,0.4), rgba(9,9,11,0.2)), url('${backdropUrl}')`;
                        }
                    })
                    .catch(err => console.error("TMDb spotlight error:", err));

                heroPlayBtn.addEventListener("click", () => {
    window.location.href = `player.html?title=${encodeURIComponent(spotlight.title)}&mal_id=${spotlight.mal_id}&img=${encodeURIComponent(spotlight.images.jpg.large_image_url || spotlight.images.jpg.image_url)}`;
});
            }

            animeList.forEach((anime, index) => {
                const wrapper = document.createElement("div");
                wrapper.className = "relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden border border-zinc-900 hover:border-zinc-700 transition duration-300";
                
                wrapper.innerHTML = `
                    <img src="${anime.images.jpg.large_image_url || anime.images.jpg.image_url}" alt="${anime.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-3 opacity-90">
                        <h3 class="font-bold text-xs md:text-sm line-clamp-1 text-white">${anime.title}</h3>
                        <p class="text-[10px] text-zinc-400 mt-0.5">★ ${anime.score || 'N/A'} • ${anime.type}</p>
                    </div>
                    <div class="absolute top-2 left-2 bg-black/80 backdrop-blur text-[10px] font-black font-mono px-2 py-0.5 rounded text-zinc-300">
                        #${index + 1}
                    </div>
                `;

               // Ensure this exact structure is written near the bottom of script.js:
wrapper.addEventListener("click", () => {
    window.location.href = `player.html?title=${encodeURIComponent(anime.title)}&mal_id=${anime.mal_id}&img=${encodeURIComponent(anime.images.jpg.large_image_url || anime.images.jpg.image_url)}`;
});
                animeGrid.appendChild(wrapper);
            });
        })
        .catch(err => {
            console.error("Grid assembly error: ", err);
            animeGrid.innerHTML = `<p class="text-xs text-zinc-500">System syncing paused.</p>`;
        });
});
