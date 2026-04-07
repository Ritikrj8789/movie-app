import React, { useEffect, useMemo, useState } from "react";

const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";
const FALLBACK_POSTER = "https://via.placeholder.com/500x750?text=No+Poster";

const categoriesList = [
  { key: "trending", title: "Trending Now" },
  { key: "popular", title: "Popular Movies" },
  { key: "top_rated", title: "Top Rated" },
  { key: "upcoming", title: "Upcoming" },
  { key: "bollywood", title: "Bollywood Movies" },
  { key: "south", title: "South Movies" },
];

function MovieCard({ movie, onSelect, onToggleWatchlist, isSaved }) {
  return (
    <div
      onClick={() => onSelect(movie.id)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{
        minWidth: 180,
        maxWidth: 180,
        background: "#111",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        color: "white",
        transition: "transform 0.3s ease",
      }}
    >
      <div style={{ position: "relative", height: 260, background: "#222" }}>
        <img
          src={
            movie.poster_path
              ? `${IMAGE_URL}${movie.poster_path}`
              : FALLBACK_POSTER
          }
          alt={movie.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onMouseEnter={(e) => (e.target.style.filter = "brightness(1.15)")}
          onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(movie);
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            borderRadius: "50%",
            width: 34,
            height: 34,
            cursor: "pointer",
            background: "rgba(0,0,0,0.7)",
            color: isSaved ? "red" : "white",
            fontSize: 18,
          }}
        >
          ❤
        </button>
      </div>

      <div style={{ padding: 10 }}>
        <div style={{ fontWeight: "bold", fontSize: 14 }}>{movie.title}</div>
        <div style={{ color: "#bbb", fontSize: 12 }}>
          {movie.release_date || "No date"}
        </div>
      </div>
    </div>
  );
}

function Row({ title, movies, onSelect, onToggleWatchlist, watchlistIds }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div style={{ padding: "20px 30px" }}>
      <h2 style={{ color: "white", marginBottom: 12 }}>{title}</h2>
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 10,
          scrollBehavior: "smooth",
        }}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onSelect}
            onToggleWatchlist={onToggleWatchlist}
            isSaved={watchlistIds.includes(movie.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [categories, setCategories] = useState({});
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [genres, setGenres] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("tmdb_watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const watchlistIds = useMemo(
    () => watchlist.map((movie) => movie.id),
    [watchlist]
  );

  const fetchFromTMDB = async (endpoint, params = "") => {
    const queryValue = params.replace("&query=", "");
    const url = `/api/tmdb?endpoint=${encodeURIComponent(
      endpoint
    )}&query=${encodeURIComponent(queryValue)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    return response.json();
  };

  useEffect(() => {
    localStorage.setItem("tmdb_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          trending,
          popular,
          topRated,
          upcoming,
          bollywood,
          south,
          genreData,
        ] = await Promise.all([
          fetchFromTMDB("/trending/movie/day"),
          fetchFromTMDB("/movie/popular"),
          fetchFromTMDB("/movie/top_rated"),
          fetchFromTMDB("/movie/upcoming"),
          fetchFromTMDB(
            "/discover/movie?with_origin_country=IN&with_original_language=hi&sort_by=popularity.desc"
          ),
          fetchFromTMDB(
            "/discover/movie?with_origin_country=IN&with_original_language=ta|te|ml|kn&sort_by=popularity.desc"
          ),
          fetchFromTMDB("/genre/movie/list"),
        ]);

        setHeroMovie(trending.results?.[0] || null);
        setGenres(genreData.genres || []);

        setCategories({
          trending: trending.results || [],
          popular: popular.results || [],
          top_rated: topRated.results || [],
          upcoming: upcoming.results || [],
          bollywood: bollywood.results || [],
          south: south.results || [],
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load movies");
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const searchText = query.trim().toLowerCase();

      const matchedGenre = genres.find(
        (genre) => genre.name.toLowerCase() === searchText
      );

      let data;

      if (matchedGenre) {
        data = await fetchFromTMDB(
          `/discover/movie?with_genres=${matchedGenre.id}&sort_by=popularity.desc`
        );
      } else {
        data = await fetchFromTMDB(
          "/search/movie",
          `&query=${encodeURIComponent(query)}`
        );
      }

      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id) => {
    setLoading(true);
    setError("");

    try {
      const details = await fetchFromTMDB(`/movie/${id}`);
      const videos = await fetchFromTMDB(`/movie/${id}/videos`);
      const trailer = (videos.results || []).find(
        (video) => video.site === "YouTube" && video.type === "Trailer"
      );

      setSelectedMovie(details);
      setTrailerKey(trailer ? trailer.key : "");
    } catch (err) {
      console.error(err);
      setError("Could not open movie details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((item) => item.id === movie.id);

      if (exists) {
        return prev.filter((item) => item.id !== movie.id);
      }

      return [movie, ...prev];
    });
  };

  const closePopup = () => {
    setSelectedMovie(null);
    setTrailerKey("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode ? "black" : "#f2f2f2",
        color: darkMode ? "white" : "black",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          padding: "16px 30px",
          background: darkMode ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.95)",
          borderBottom: darkMode ? "1px solid #222" : "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ color: "red", fontSize: 28, fontWeight: "bold" }}>
            MOVIE HUB 
          </div>
          <div style={{ fontSize: 13, color: darkMode ? "#aaa" : "#555" }}>
            Trending • Popular • Top Rated • Upcoming • Bollywood • South
          </div>
        </div>

        <button
          onClick={() => setDarkMode((prev) => !prev)}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            background: darkMode ? "#fff" : "#111",
            color: darkMode ? "#000" : "#fff",
            fontWeight: "bold",
          }}
        >
          {darkMode ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      {heroMovie && (
        <div
          style={{
            height: "70vh",
            backgroundImage: `url(${BACKDROP_URL}${heroMovie.backdrop_path})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            padding: 30,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.6), rgba(0,0,0,0.2))",
            }}
          />

          <div style={{ position: "relative", zIndex: 2, maxWidth: 700 }}>
            <h1 style={{ fontSize: 48, marginBottom: 10 }}>
              {heroMovie.title}
            </h1>
            <p style={{ color: "#ddd", marginBottom: 15 }}>
              {heroMovie.overview}
            </p>

            <button
              onClick={() => handleSelect(heroMovie.id)}
              style={{
                padding: "10px 20px",
                backgroundColor: "white",
                color: "black",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ▶ View Details
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", padding: 30 }}>
        <input
          placeholder="Search movies or genres like thriller, action..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{
            padding: 12,
            width: 320,
            borderRadius: 6,
            border: "1px solid #333",
            marginRight: 10,
            backgroundColor: darkMode ? "#111" : "white",
            color: darkMode ? "white" : "black",
            outline: "none",
            boxShadow: "0 0 10px rgba(255,0,0,0.3)",
          }}
        />

        <button
          onClick={handleSearch}
          onMouseEnter={(e) => (e.target.style.opacity = 0.8)}
          onMouseLeave={(e) => (e.target.style.opacity = 1)}
          style={{
            padding: "12px 20px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.3s",
          }}
        >
          Search
        </button>
      </div>

      {error && (
        <p style={{ textAlign: "center", color: "red", marginBottom: 20 }}>
          {error}
        </p>
      )}

      {loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginBottom: 20 }}>
          🎬 Loading awesome movies...
        </p>
      )}

      {watchlist.length > 0 && (
        <Row
          title="My Watchlist"
          movies={watchlist}
          onSelect={handleSelect}
          onToggleWatchlist={toggleWatchlist}
          watchlistIds={watchlistIds}
        />
      )}

      {searchResults.length > 0 && (
        <Row
          title={`Search Results: ${query}`}
          movies={searchResults}
          onSelect={handleSelect}
          onToggleWatchlist={toggleWatchlist}
          watchlistIds={watchlistIds}
        />
      )}

      {Object.entries(categories).map(([key, movies]) => {
        const title =
          categoriesList.find((item) => item.key === key)?.title || key;

        return (
          <Row
            key={key}
            title={title}
            movies={movies}
            onSelect={handleSelect}
            onToggleWatchlist={toggleWatchlist}
            watchlistIds={watchlistIds}
          />
        );
      })}

      <div
        style={{
          textAlign: "center",
          padding: 20,
          color: darkMode ? "#888" : "#666",
          marginTop: 30,
        }}
      >
        Built with React and TMDB API
      </div>

      {selectedMovie && (
        <div
          onClick={closePopup}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "black",
              padding: 20,
              borderRadius: 10,
              maxWidth: 700,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <h2>{selectedMovie.title}</h2>

              <button
                onClick={closePopup}
                style={{
                  background: "transparent",
                  color: "white",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✖
              </button>
            </div>

            {trailerKey ? (
              <iframe
                width="100%"
                height="300"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title="Trailer"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <p>Trailer unavailable for this title.</p>
            )}

            <img
              src={
                selectedMovie.poster_path
                  ? `${IMAGE_URL}${selectedMovie.poster_path}`
                  : FALLBACK_POSTER
              }
              width="200"
              alt={selectedMovie.title}
              style={{ marginTop: 15, borderRadius: 8 }}
            />

            <p>
              <b>Release Date:</b> {selectedMovie.release_date}
            </p>
            <p>
              <b>Rating:</b> {selectedMovie.vote_average}
            </p>
            <p>
              <b>Runtime:</b> {selectedMovie.runtime} min
            </p>
            <p>
              <b>Overview:</b> {selectedMovie.overview}
            </p>

            <button
              onClick={() => toggleWatchlist(selectedMovie)}
              style={{
                marginTop: 10,
                padding: "10px 18px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {watchlistIds.includes(selectedMovie.id)
                ? "Remove from Watchlist"
                : "Add to Watchlist"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}