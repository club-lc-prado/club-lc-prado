import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Journeys.css";
import journeysBg from "../journeys-bg.jpg";

function getSeasonIcon() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "💗";
  if (month >= 5 && month <= 7) return "💚";
  if (month >= 8 && month <= 10) return "💛";
  return "❄️";
}

function Journeys() {
  const [user, setUser] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "journeys"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      setJourneys(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = journeys.filter((j) => j.date >= today);
  const past = journeys.filter((j) => j.date < today);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <div className="journeys-page">
      <div className="journeys-bg-fixed" style={{ backgroundImage: `url(${journeysBg})` }}></div>
      <div className="journeys-bg-overlay"></div>
      <div className="journeys-header">
        <div>
          <h1 className="journeys-title">Путешествия</h1>
          <div className="journeys-underline"></div>
        </div>
        <Link to={user ? "/journeys/new" : "/login"} className="journeys-btn">
          + Кинуть клич
        </Link>
      </div>

      {loading && <div className="journeys-empty">Загрузка...</div>}

      {!loading && (
        <>
          <div className="journeys-section">
            <div className="journeys-section-label">Ближайшие встречи</div>
            {upcoming.length === 0 ? (
              <div className="journeys-empty">Пока не запланировано. Будь первым — кинь клич.</div>
            ) : (
              upcoming.map((j, i) => (
                <Link to={`/journeys/${j.id}`} key={j.id} className="journeys-card upcoming">
                  {i === 0 && <span className="journeys-pulse">{getSeasonIcon()}</span>}
                  <div className="journeys-card-date">{formatDate(j.date)}</div>
                  <div className="journeys-card-title">{j.title}</div>
                  <div className="journeys-card-place">{j.place}</div>
                  <div className="journeys-card-participants">
                    Едут: {j.participants?.length || 0}
                  </div>
                </Link>
              ))
            )}
          </div>

          {past.length > 0 && (
            <div className="journeys-section">
              <div className="journeys-section-label">Прошедшие выезды</div>
              {past.slice().reverse().map((j) => (
                <Link to={`/journeys/${j.id}`} key={j.id} className="journeys-card past">
                  <div className="journeys-card-date">{formatDate(j.date)}</div>
                  <div className="journeys-card-title">{j.title}</div>
                  <div className="journeys-card-place">{j.place}</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Journeys;