# Anime.TV 🎬

A premium, fast, and high-performance cinematic anime directory and portal built entirely with vanilla frontend technologies. Anime.TV delivers an immersive browsing experience complete with fluid animations, dynamic data streaming, and an advanced layout built to handle massive content catalogs seamlessly.

🌐 **Live Demo:** [anime-tv-67.vercel.app](https://anime-tv-67.vercel.app/)

---

## ✨ Features

* **Cinematic Spotlight Carousel:** An interactive, auto-cycling hero banner showcasing top trending titles, seamlessly integrated with the **TMDB API** to pull high-resolution background assets dynamically.
* **Advanced Multi-Filter System:** Filter down content instantly by format (TV, Movie, OVA, Special), Genre clusters, Release Status, or sort indexing (Score, Popularity, Favorites) utilizing efficient query structures.
* **Smart Content Architecture:** Fully reactive responsive grids displaying anime cards equipped with micro-details (type, rating flags, titles) and interactive hover overlays presenting snapshot synopses.
* **Persistent "Continue Watching" Engine:** Client-side tracking powered by `localStorage` to preserve user watch history and display active sessions directly on the dashboard.
* **A-Z Alphabetical Indexing:** An elegant dropdown multi-row locator map routing requests instantly based on character starting nodes.
* **Tactile Interactive Layer:** Premium state-managed Light/Dark theme configuration coupled with a localized cursor click-ripple simulation engine for optimized feedback.
* **Serverless Request System:** Integration via Formspree creating a frictionless pipeline for users to report bugs or submit missing title catalog requests.

---

## 🛠️ Tech Stack

* **Frontend Structure:** HTML5 (Semantic Layouts)
* **Styling Framework:** Tailwind CSS (Utility-first styling core)
* **Dynamic Animations:** Custom CSS3 keyframing (Theme shifts, click effects)
* **Programming Core:** Vanilla JavaScript (ES6+ Asynchronous architecture, Fetch API)
* **Data Providers:** * **Jikan API** (Official open-source MyAnimeList data engine)
  * **The Movie Database (TMDB) API** (High-fidelity backdrop media acquisition)

---

## 📂 Project Structure

```text
├── index.html        # Premium cinematic landing interface
├── home.html         # Main app browsing directory and filtering dashboard
├── info.html         # Anime deep-dive layout with dynamic cast rendering
├── script.js         # Core logic (Carousel management, sorting, grid building)
├── stream.js         # Stream modal processing & server routing engines
├── style.css         # Styling rules for theme transitions and ripple effects
└── terms.html/etc.   # Auxiliary platform documentation pages
```

---

## 🚀 Local Setup & Installation

Since this project leverages a clean, serverless frontend ecosystem, setting it up locally takes seconds.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/ojussharma07/anime-site.git](https://github.com/ojussharma07/anime-site.git)
   ```

2. **Navigate into the directory:**
   ```bash
   cd anime-site
   ```

3. **Launch the platform:**
   * Simply open `index.html` inside any modern web browser.
   * *Alternatively*, run it through a local development server such as the **Live Server** extension in VS Code to ensure smooth path mapping.

---

## 📄 License & Disclaimer

Anime.TV does not parse, store, or host physical media streams on local cloud directories. This program acts strictly as an educational content routing portal interface, pulling structural information and visual banners exclusively from publicly accessible metadata frameworks.
