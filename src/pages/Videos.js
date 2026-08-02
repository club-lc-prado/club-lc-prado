import { useState, useEffect, useRef } from "react";
import "./Videos.css";

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  const loadVideos = (query) => {
    setLoading(true);
    setError(null);
    setPlaying(null);
    setShowSuggestions(false);
    const url = query ? `/api/search-videos?q=${encodeURIComponent(query)}` : "/api/search-videos";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setVideos(data.videos || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Не удалось загрузить видео");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVideos(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetch(`/api/youtube-suggest?q=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setShowSuggestions((data.suggestions || []).length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        });
    }, 300);
  };

  const pickSuggestion = (s) => {
    setSearchInput(s);
    setShowSuggestions(false);
    loadVideos(s);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadVideos(searchInput.trim() || null);
  };

  return (
    <div className="videos-page">
      <h1 className="videos-title">Видео</h1>
      <div className="videos-underline"></div>

      <form className="videos-search-form" onSubmit={handleSearch} ref={wrapRef}>
        <div className="videos-search-input-wrap">
          <input
            type="text"
            placeholder="Поиск других видео на YouTube..."
            value={searchInput}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="videos-suggest-dropdown">
              {suggestions.map((s, i) => (
                <div key={i} className="videos-suggest-item" onClick={() => pickSuggestion(s)}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit">Найти</button>
        {searchInput && (
          <button
            type="button"
            className="videos-search-reset"
            onClick={() => { setSearchInput(""); setSuggestions([]); loadVideos(null); }}
          >
            Сбросить
          </button>
        )}
      </form>

      {loading && <div className="videos-empty">Загрузка...</div>}
      {error && <div className="videos-empty">{error}</div>}
      {!loading && !error && videos.length === 0 && (
        <div className="videos-empty">Пока ничего не найдено.</div>
      )}

      <div className="videos-grid">
        {videos.map((v) => (
          <div key={v.id} className="video-card">
            {playing === v.id ? (
              <div className="video-player-wrap">
                <iframe
                  src={`https://www.youtube.com/embed/${v.id}?autoplay=1`}
                  title={v.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="video-thumb-wrap" onClick={() => setPlaying(v.id)}>
                <img src={v.thumbnail} alt={v.title} />
                <div className="video-play-icon">▶</div>
              </div>
            )}
            <div className="video-card-title">{v.title}</div>
            <div className="video-card-channel">{v.channel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Videos;