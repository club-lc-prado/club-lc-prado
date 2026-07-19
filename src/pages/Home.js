import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Home.css";
import heroImage from "../hero-prado.jpg";

function Home() {
  const { t, lang, changeLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberCount, setMemberCount] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "members", u.uid));
        if (snap.exists()) setProfile(snap.data());
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      const snap = await getDocs(collection(db, "members"));
      setMemberCount(snap.size);
    };
    loadCount();
  }, []);

  return (
    <div className="hero">
      <div className="hero-bg" style={{ backgroundImage: `url(${heroImage})` }}></div>
      <div className="hero-overlay"></div>

      <div className="lang-switch">
        <button className={lang === "ru" ? "active" : ""} onClick={() => changeLang("ru")}>RU</button>
        <button className={lang === "de" ? "active" : ""} onClick={() => changeLang("de")}>DE</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>EN</button>
        <button className={lang === "ua" ? "active" : ""} onClick={() => changeLang("ua")}>UA</button>
      </div>

      <div className="hero-title-block">
        <div className="hero-eyebrow">TOYOTA</div>
        <h1 className="hero-title">PRADO</h1>
        <div className="hero-sub-label">CLUB</div>
        <div className="hero-tagline">{t.home.eyebrow}</div>
      </div>

      <div className="hero-content">
        <h2 className="hero-slogan">
          {t.home.titleLines.map((line, i) => (
            <span key={i} className="hero-slogan-line">{line}</span>
          ))}
        </h2>
        <div className="hero-underline"></div>
        <p className="hero-subtitle">{t.home.subtitle}</p>
      </div>

      <div className="hero-strip">
        <Link to={user ? "/feed" : "/login"} className="hero-strip-account">
          <div className="hero-strip-avatar">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="avatar" />
            ) : (
              profile?.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="hero-strip-account-text">
            <span className="hero-strip-account-name">
              {profile?.name || "Гость"}
            </span>
            <span className="hero-strip-account-sub">
              {user ? "→ Лента" : "→ Войти"}
            </span>
          </div>
        </Link>

        <div className="hero-strip-cards">
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMeeting}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
          <Link to="/members" className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMembers}</span>
            <span className="hero-strip-card-value">{memberCount ?? "—"}</span>
          </Link>
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardTrip}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
        </div>

        <div className="hero-strip-tag">{t.home.tagline}</div>
      </div>
    </div>
  );
}

export default Home;