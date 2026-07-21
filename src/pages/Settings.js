import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Settings.css";

const languages = [
  { code: "ru", label: "Русский" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "ua", label: "Українська" },
];

function Settings() {
  const { t, lang, changeLang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [visibleInCatalog, setVisibleInCatalog] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "members", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setVisibleInCatalog(data.visibleInCatalog !== false);
        setShowCity(data.showCity !== false);
      }
      setLoading(false);
    });
    return unsub;
  }, [navigate]);

  const handleSave = async (field, value) => {
    await updateDoc(doc(db, "members", user.uid), { [field]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading) return <div className="settings-page"></div>;

  return (
    <div className="settings-page">
      <Link to="/feed" className="settings-back">{t.settings.backToFeed}</Link>

      <h1 className="settings-title">{t.settings.title}</h1>
      <div className="settings-underline"></div>

      <div className="settings-section">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">{t.settings.language}</div>
            <div className="settings-row-sub">{t.settings.languageSub}</div>
          </div>
          <select
            className="settings-lang-select"
            value={lang}
            onChange={(e) => changeLang(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">{t.settings.showInCatalog}</div>
            <div className="settings-row-sub">{t.settings.showInCatalogSub}</div>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={visibleInCatalog}
              onChange={(e) => {
                setVisibleInCatalog(e.target.checked);
                handleSave("visibleInCatalog", e.target.checked);
              }}
            />
            <span></span>
          </label>
        </div>

        {visibleInCatalog && (
          <div className="settings-row">
            <div>
              <div className="settings-row-label">{t.settings.showCity}</div>
              <div className="settings-row-sub">{t.settings.showCitySub}</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={showCity}
                onChange={(e) => {
                  setShowCity(e.target.checked);
                  handleSave("showCity", e.target.checked);
                }}
              />
              <span></span>
            </label>
          </div>
        )}
      </div>

      {saved && <div className="settings-saved">{t.settings.saved}</div>}
    </div>
  );
}

export default Settings;