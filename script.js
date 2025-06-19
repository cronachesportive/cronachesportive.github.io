document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "a0a4b3022e4e84913c36eac72a7b59ee"; // GNews API Key
  const DEFAULT_IMG = "default-image.jpg";

  const links = document.querySelectorAll(".section-selector a");
  const pages = document.querySelectorAll(".page");

  const categoryQueries = {
    home: "", // non usata direttamente
    calcio: "calcio OR football OR soccer",
    nuoto: "nuoto OR swimming",
    tennis: "tennis",
    basket: "basket OR basketball",
    formula1: "formula 1 OR f1",
    equitazione: "equitazione OR horse riding OR equestrian",
    atletica: "atletica OR athletics OR track and field"
  };

  function showPage(category) {
    pages.forEach(page => {
      page.classList.toggle("active", page.id === category);
    });
    links.forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-category") === category);
    });
  }

  async function fetchNews(category) {
    const container = document.querySelector(`#${category} .news-grid`);
    container.innerHTML = "Caricamento notizie...";

    if (category === "home") {
      // Per la home: fetch paralleli per ogni categoria sportiva
      const sportCategories = Object.keys(categoryQueries).filter(cat => cat !== "home");

      try {
        // Prendo fino a 3 articoli per categoria
        const promises = sportCategories.map(cat => getNews(cat, 3));
        const results = await Promise.all(promises);

        // Unisco tutte le notizie in un unico array
        let allArticles = results.flat();

        // Ordino per data decrescente (se disponibile)
        allArticles.sort((a, b) => {
          const dateA = new Date(a.publishedAt || 0);
          const dateB = new Date(b.publishedAt || 0);
          return dateB - dateA;
        });

        // Prendo massimo 9 notizie in home
        allArticles = allArticles.slice(0, 3);

        if (allArticles.length === 0) {
          container.innerHTML = "<p>Nessuna notizia disponibile.</p>";
          return;
        }

        container.innerHTML = "";
        allArticles.forEach(article => {
          const newsDiv = document.createElement("div");
          newsDiv.classList.add("news-item");

          newsDiv.innerHTML = `
            <img src="${article.image || DEFAULT_IMG}" alt="Immagine notizia" onerror="this.src='${DEFAULT_IMG}'"/>
            <h3>${article.title || "Titolo non disponibile"}</h3>
            <p>${article.description || "Descrizione non disponibile."}</p>
            <a href="${article.url}" target="_blank" rel="noopener noreferrer">Leggi di più</a>
          `;
          container.appendChild(newsDiv);
        });
      } catch (error) {
        console.error("Errore nel caricamento delle notizie sportive per home:", error);
        container.innerHTML = "<p>Errore nel caricamento delle notizie.</p>";
      }
      return;
    }

    // Per le altre categorie
    const articles = await getNews(category, 10);
    if (articles.length === 0) {
      container.innerHTML = "<p>Nessuna notizia disponibile per questa categoria.</p>";
      return;
    }

    container.innerHTML = "";
    articles.forEach(article => {
      const newsDiv = document.createElement("div");
      newsDiv.classList.add("news-item");

      newsDiv.innerHTML = `
        <img src="${article.image || DEFAULT_IMG}" alt="Immagine notizia" onerror="this.src='${DEFAULT_IMG}'"/>
        <h3>${article.title || "Titolo non disponibile"}</h3>
        <p>${article.description || "Descrizione non disponibile."}</p>
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">Leggi di più</a>
      `;

      container.appendChild(newsDiv);
    });
  }

  async function getNews(category, max = 10) {
    const query = categoryQueries[category] || "";
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=it&max=${max}&token=${API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Errore API: ${response.status}`);
      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error(`Errore nel caricamento per ${category}:`, error);
      return [];
    }
  }

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const category = link.getAttribute("data-category");
      showPage(category);
      fetchNews(category);
      history.pushState({ category }, "", `#${category}`);
    });
  });

  window.addEventListener("popstate", e => {
    const category = (e.state && e.state.category) || "home";
    showPage(category);
    fetchNews(category);
  });

  // Inizializzazione
  const initialCategory = window.location.hash.substring(1) || "home";
  showPage(initialCategory);
  fetchNews(initialCategory);
});
