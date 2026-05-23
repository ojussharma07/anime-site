// Wait until the HTML page loads entirely
document.addEventListener("DOMContentLoaded", () => {
    const animeGrid = document.getElementById("anime-grid");

    // Fetch trending anime from Jikan API
    fetch("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=15")
        .then(response => response.json())
        .then(data => {
            // Clear out the "Loading..." placeholder text
            animeGrid.innerHTML = "";

            // Loop through each anime item in the API array
            data.data.forEach(anime => {
                // Create a container card for the anime
                const card = document.createElement("div");
                card.className = "bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full";

                // Generate structural inside layout for the card
                card.innerHTML = `
                    <div class="relative overflow-hidden aspect-[3/4]">
                        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                        <span class="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-xs font-bold text-indigo-400 px-2 py-1 rounded">
                            ★ ${anime.score || 'N/A'}
                        </span>
                    </div>
                    <div class="p-3 flex-grow flex flex-col justify-between">
                        <h3 class="font-semibold text-sm line-clamp-2 group-hover:text-indigo-400 transition mb-1">${anime.title}</h3>
                        <p class="text-xs text-zinc-500">${anime.type} (${anime.episodes || '?'} Eps)</p>
                    </div>
                `;

                // Interactive click behavior: redirect to our video player page with custom URL parameters
                card.addEventListener("click", () => {
                    // We pass the title and image URL directly inside the link parameters so player.html knows what to load
                    window.location.href = `player.html?title=${encodeURIComponent(anime.title)}&mal_id=${anime.mal_id}&img=${encodeURIComponent(anime.images.jpg.image_url)}`;
                });

                // Inject card back into index.html DOM grid
                animeGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error("API error:", error);
            animeGrid.innerHTML = `<p class="text-red-500 col-span-full">Failed to load content. Try refreshing.</p>`;
        });
});