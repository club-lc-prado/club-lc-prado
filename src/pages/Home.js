import { useLanguage } from "../i18n/LanguageContext";
import "./Home.css";
import heroImage from "../hero-prado.jpg";

function Home() {
  const { t, lang, changeLang } = useLanguage();

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
        <div className="hero-strip-quote">{t.home.quote}</div>

        <div className="hero-strip-cards">
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMeeting}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMembers}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
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