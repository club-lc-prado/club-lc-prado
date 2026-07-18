import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Settings.css";

function Settings() {
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
      <Link to="/feed" className="settings-back">← Назад в ленту</Link>

      <h1 className="settings-title">Настройки и конфиденциальность</h1>
      <div className="settings-underline"></div>

      <div className="settings-section">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Показывать меня в каталоге участников</div>
            <div className="settings-row-sub">Другие участники клуба смогут найти твой профиль</div>
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
              <div className="settings-row-label">Показывать мой город</div>
              <div className="settings-row-sub">Виден в каталоге и публичном профиле</div>
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

      {saved && <div className="settings-saved">Сохранено</div>}
    </div>
  );
}

export default Settings;