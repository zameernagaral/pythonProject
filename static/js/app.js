/**
 * ============================================================
 * NewsFlow — Frontend Application Logic
 * ============================================================
 * Handles search, article rendering, pagination, bookmarks,
 * and toast notifications. Communicates with the Flask API.
 * ============================================================
 */

(function () {
    "use strict";

    // --------------------------------------------------------
    // DOM REFERENCES
    // --------------------------------------------------------
    const searchForm      = document.getElementById("search-form");
    const searchInput     = document.getElementById("search-input");
    const sortSelect      = document.getElementById("sort-select");
    const searchBtn       = document.getElementById("search-btn");

    const articlesGrid    = document.getElementById("articles-grid");
    const skeletonGrid    = document.getElementById("skeleton-grid");
    const resultsHeader   = document.getElementById("results-header");
    const resultsTitle    = document.getElementById("results-title");
    const resultsCount    = document.getElementById("results-count");
    const emptyState      = document.getElementById("empty-state");
    const errorMessage    = document.getElementById("error-message");
    const errorText       = document.getElementById("error-text");
    const retryBtn        = document.getElementById("retry-btn");

    const loadMoreWrapper = document.getElementById("load-more-wrapper");
    const loadMoreBtn     = document.getElementById("load-more-btn");

    const bookmarksToggle = document.getElementById("bookmarks-toggle");
    const bookmarkCount   = document.getElementById("bookmark-count");
    const drawer          = document.getElementById("bookmarks-drawer");
    const drawerOverlay   = document.getElementById("drawer-overlay");
    const drawerClose     = document.getElementById("drawer-close");
    const bookmarksList   = document.getElementById("bookmarks-list");
    const bookmarksEmpty  = document.getElementById("bookmarks-empty");

    const toastContainer  = document.getElementById("toast-container");


    // --------------------------------------------------------
    // APPLICATION STATE
    // --------------------------------------------------------
    let currentQuery   = "";
    let currentSort    = "relevance";
    let currentPage    = 1;
    let totalResults   = 0;
    let allArticles    = [];        // Accumulated articles from all pages
    let bookmarks      = [];        // Current bookmarks list
    let isLoading      = false;


    // --------------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------------
    function init() {
        // Attach event listeners
        searchForm.addEventListener("submit", handleSearch);
        retryBtn.addEventListener("click", handleRetry);
        loadMoreBtn.addEventListener("click", handleLoadMore);

        bookmarksToggle.addEventListener("click", openDrawer);
        drawerOverlay.addEventListener("click", closeDrawer);
        drawerClose.addEventListener("click", closeDrawer);

        // Close drawer on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDrawer();
        });

        // Load bookmarks on startup
        loadBookmarks();
    }


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    /**
     * Handle search form submission.
     */
    function handleSearch(e) {
        e.preventDefault();

        const query = searchInput.value.trim();
        if (!query || isLoading) return;

        // Reset state for a new search
        currentQuery = query;
        currentSort  = sortSelect.value;
        currentPage  = 1;
        allArticles  = [];

        // Clear the grid
        articlesGrid.innerHTML = "";

        fetchNews();
    }

    /**
     * Retry the last search.
     */
    function handleRetry() {
        if (currentQuery) {
            currentPage = 1;
            allArticles = [];
            articlesGrid.innerHTML = "";
            fetchNews();
        }
    }

    /**
     * Load the next page of results.
     */
    function handleLoadMore() {
        if (!isLoading) {
            currentPage++;
            fetchNews(true);  // append = true
        }
    }

    /**
     * Fetch news articles from the backend API.
     *
     * @param {boolean} append — If true, appends to existing results
     */
    async function fetchNews(append = false) {
        isLoading = true;
        showLoading(true);
        hideError();

        if (!append) {
            emptyState.style.display = "none";
        }

        const params = new URLSearchParams({
            q: currentQuery,
            sort: currentSort,
            page: currentPage,
        });

        try {
            const response = await fetch(`/api/news?${params}`);
            const data = await response.json();

            if (data.status === "error") {
                showError(data.error || "Failed to fetch news");
                return;
            }

            totalResults = data.totalResults || 0;

            if (!append) {
                allArticles = data.articles || [];
            } else {
                allArticles = allArticles.concat(data.articles || []);
            }

            // Render articles
            renderArticles(data.articles || [], append);

            // Update results header
            resultsHeader.style.display = "flex";
            resultsTitle.textContent = `Results for "${currentQuery}"`;
            resultsCount.textContent = `Showing ${allArticles.length} of ${totalResults.toLocaleString()} articles`;

            // Show/hide load more button
            const hasMore = allArticles.length < totalResults && (data.articles || []).length > 0;
            loadMoreWrapper.style.display = hasMore ? "block" : "none";

        } catch (err) {
            showError("Network error. Please check your connection and try again.");
            console.error("Fetch error:", err);
        } finally {
            isLoading = false;
            showLoading(false);
        }
    }


    // --------------------------------------------------------
    // RENDER ARTICLES
    // --------------------------------------------------------

    /**
     * Render article cards into the grid.
     *
     * @param {Array}   articles — Array of article objects
     * @param {boolean} append   — Whether to append or replace
     */
    function renderArticles(articles, append = false) {
        if (!append) {
            articlesGrid.innerHTML = "";
        }

        if (articles.length === 0 && !append) {
            emptyState.style.display = "block";
            emptyState.querySelector("h3").textContent = "No articles found";
            emptyState.querySelector("p").textContent = "Try a different search term";
            emptyState.querySelector(".empty-state__icon").textContent = "🔍";
            return;
        }

        articles.forEach((article) => {
            const card = createArticleCard(article);
            articlesGrid.appendChild(card);
        });
    }

    /**
     * Create a single article card element.
     *
     * @param {Object} article — Article data object
     * @returns {HTMLElement}
     */
    function createArticleCard(article) {
        const card = document.createElement("article");
        card.className = "card";

        const isBookmarked = bookmarks.some((b) => b.url === article.url);
        const dateStr = formatDate(article.publishedAt);

        card.innerHTML = `
            <div class="card__image-wrapper">
                ${article.urlToImage
                    ? `<img class="card__image" src="${escapeHtml(article.urlToImage)}" alt="${escapeHtml(article.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card__image-fallback\\'>📰</div>'">`
                    : `<div class="card__image-fallback">📰</div>`
                }
                <span class="card__source-badge">${escapeHtml(article.source)}</span>
                <button class="card__bookmark-btn ${isBookmarked ? "bookmarked" : ""}"
                        aria-label="${isBookmarked ? "Remove bookmark" : "Bookmark article"}"
                        title="${isBookmarked ? "Remove bookmark" : "Bookmark article"}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </div>
            <div class="card__body">
                <h3 class="card__title">
                    <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(article.title)}
                    </a>
                </h3>
                <p class="card__description">${escapeHtml(article.description)}</p>
                <div class="card__meta">
                    <span class="card__author">By ${escapeHtml(article.author)}</span>
                    <span class="card__date">${dateStr}</span>
                </div>
            </div>
        `;

        // Attach bookmark button handler
        const bookmarkBtn = card.querySelector(".card__bookmark-btn");
        bookmarkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleBookmark(article, bookmarkBtn);
        });

        return card;
    }


    // --------------------------------------------------------
    // BOOKMARKS
    // --------------------------------------------------------

    /**
     * Load all bookmarks from the API.
     */
    async function loadBookmarks() {
        try {
            const response = await fetch("/api/bookmarks");
            const data = await response.json();
            bookmarks = data.bookmarks || [];
            updateBookmarkCount();
            renderBookmarkDrawer();
        } catch (err) {
            console.error("Failed to load bookmarks:", err);
        }
    }

    /**
     * Toggle bookmark status for an article.
     *
     * @param {Object}      article     — The article to bookmark/unbookmark
     * @param {HTMLElement}  buttonEl    — The bookmark button element
     */
    async function toggleBookmark(article, buttonEl) {
        const isCurrentlyBookmarked = bookmarks.some((b) => b.url === article.url);

        if (isCurrentlyBookmarked) {
            // Remove bookmark
            try {
                const res = await fetch("/api/bookmarks", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: article.url }),
                });
                const data = await res.json();

                if (data.success) {
                    bookmarks = bookmarks.filter((b) => b.url !== article.url);
                    updateBookmarkButton(buttonEl, false);
                    updateBookmarkCount();
                    renderBookmarkDrawer();
                    showToast("Bookmark removed", "info");
                }
            } catch (err) {
                showToast("Failed to remove bookmark", "error");
            }
        } else {
            // Add bookmark
            try {
                const res = await fetch("/api/bookmarks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(article),
                });
                const data = await res.json();

                if (data.success) {
                    bookmarks.push(article);
                    updateBookmarkButton(buttonEl, true);
                    updateBookmarkCount();
                    renderBookmarkDrawer();
                    showToast("Article bookmarked!", "success");
                } else {
                    showToast(data.message || "Already bookmarked", "info");
                }
            } catch (err) {
                showToast("Failed to add bookmark", "error");
            }
        }
    }

    /**
     * Update the visual state of a bookmark button.
     */
    function updateBookmarkButton(btn, isBookmarked) {
        if (isBookmarked) {
            btn.classList.add("bookmarked");
            btn.setAttribute("aria-label", "Remove bookmark");
            btn.setAttribute("title", "Remove bookmark");
            btn.querySelector("svg").setAttribute("fill", "currentColor");
        } else {
            btn.classList.remove("bookmarked");
            btn.setAttribute("aria-label", "Bookmark article");
            btn.setAttribute("title", "Bookmark article");
            btn.querySelector("svg").setAttribute("fill", "none");
        }
    }

    /**
     * Update the bookmark count badge.
     */
    function updateBookmarkCount() {
        bookmarkCount.textContent = bookmarks.length;
    }

    /**
     * Render the bookmarks drawer content.
     */
    function renderBookmarkDrawer() {
        bookmarksList.innerHTML = "";

        if (bookmarks.length === 0) {
            bookmarksEmpty.classList.add("show");
            return;
        }

        bookmarksEmpty.classList.remove("show");

        bookmarks.forEach((article) => {
            const el = document.createElement("div");
            el.className = "bookmark-card";
            el.innerHTML = `
                <div class="bookmark-card__image">
                    ${article.urlToImage
                        ? `<img src="${escapeHtml(article.urlToImage)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'bookmark-card__image-fallback\\'>📰</div>'">`
                        : `<div class="bookmark-card__image-fallback">📰</div>`
                    }
                </div>
                <div class="bookmark-card__body">
                    <h4 class="bookmark-card__title">
                        <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a>
                    </h4>
                    <span class="bookmark-card__source">${escapeHtml(article.source || "Unknown")}</span>
                </div>
                <button class="btn btn--icon btn--danger bookmark-card__remove" aria-label="Remove bookmark" title="Remove bookmark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m18 6-12 12M6 6l12 12"/>
                    </svg>
                </button>
            `;

            // Remove bookmark handler
            el.querySelector(".bookmark-card__remove").addEventListener("click", async () => {
                try {
                    const res = await fetch("/api/bookmarks", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: article.url }),
                    });
                    const data = await res.json();

                    if (data.success) {
                        bookmarks = bookmarks.filter((b) => b.url !== article.url);
                        updateBookmarkCount();
                        renderBookmarkDrawer();
                        refreshArticleBookmarkStates();
                        showToast("Bookmark removed", "info");
                    }
                } catch (err) {
                    showToast("Failed to remove bookmark", "error");
                }
            });

            bookmarksList.appendChild(el);
        });
    }

    /**
     * After removing a bookmark from the drawer, refresh all
     * article card bookmark buttons to reflect the new state.
     */
    function refreshArticleBookmarkStates() {
        const buttons = articlesGrid.querySelectorAll(".card__bookmark-btn");
        buttons.forEach((btn) => {
            // Find the article URL from the card's link
            const card = btn.closest(".card");
            const link = card.querySelector(".card__title a");
            if (!link) return;

            const url = link.getAttribute("href");
            const isBookmarked = bookmarks.some((b) => b.url === url);
            updateBookmarkButton(btn, isBookmarked);
        });
    }


    // --------------------------------------------------------
    // DRAWER TOGGLE
    // --------------------------------------------------------
    function openDrawer() {
        drawer.classList.add("open");
        drawerOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
        drawer.classList.remove("open");
        drawerOverlay.classList.remove("open");
        document.body.style.overflow = "";
    }


    // --------------------------------------------------------
    // UI HELPERS
    // --------------------------------------------------------

    /**
     * Show or hide the skeleton loading grid.
     */
    function showLoading(show) {
        skeletonGrid.style.display = show ? "grid" : "none";
        searchBtn.disabled = show;
        searchBtn.textContent = show ? "Searching…" : "Search";
    }

    /**
     * Show an error message.
     */
    function showError(message) {
        errorMessage.style.display = "block";
        errorText.textContent = message;
        emptyState.style.display = "none";
        resultsHeader.style.display = "none";
        loadMoreWrapper.style.display = "none";
    }

    /**
     * Hide the error message.
     */
    function hideError() {
        errorMessage.style.display = "none";
    }

    /**
     * Display a toast notification.
     *
     * @param {string} message — Toast message text
     * @param {string} type    — "success" | "error" | "info"
     */
    function showToast(message, type = "info") {
        const icons = {
            success: "✅",
            error: "❌",
            info: "ℹ️",
        };

        const toast = document.createElement("div");
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <span class="toast__icon">${icons[type] || "ℹ️"}</span>
            <span>${escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        // Remove toast after animation completes (3 seconds)
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Format an ISO date string to a readable format.
     */
    function formatDate(isoString) {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffHours < 1) return "Just now";
            if (diffHours < 24) return `${diffHours}h ago`;

            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
            });
        } catch {
            return "";
        }
    }

    /**
     * Escape HTML special characters to prevent XSS.
     */
    function escapeHtml(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }


    // --------------------------------------------------------
    // BOOT
    // --------------------------------------------------------
    init();
})();
