document.addEventListener("DOMContentLoaded", () => {
    const animeGrid = document.getElementById("anime-grid");
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-desc");
    const heroBanner = document.getElementById("hero-banner");
    const heroPlayBtn = document.getElementById("hero-play-btn");

    fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10")
        .then(response => response.json())
        .then(data => {
            animeGrid.innerHTML = "";
            const animeList = data.data;

            // Set up the Spotlight Hero banner with the #1 Trending show info
            if(animeList.length > 0) {
                const spotlight = animeList[0];
                heroTitle.textContent = spotlight.title;
                heroDesc.textContent = spotlight.synopsis || "No description overview listing indexed yet.";
                
                // Use a high-quality landscape layout fallback if background banners aren't in standard endpoints
                heroPlayBtn.addEventListener("click", () => {
                    window.location.href = `player.html?title=${encodeURIComponent(spotlight.title)}&mal_id=${spotlight.mal_id}&img=${encodeURIComponent(spotlight.images.jpg.large_image_url)}`;
                });
            }

            // Populate horizontal ranking system cards
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

                wrapper.addEventListener("click", () => {
    window.location.href = `player.html?title=${encodeURIComponent(anime.title)}&mal_id=${anime.mal_id}&img=${encodeURIComponent(anime.images.jpg.large_image_url || anime.images.jpg.image_url)}`;
});
                animeGrid.appendChild(wrapper);
            });
        })
        .catch(err => {
            console.error("Grid assembly network breakdown: ", err);
            animeGrid.innerHTML = `<p class="text-xs text-zinc-500">System syncing paused. Retry.</p>`;
        });
});
