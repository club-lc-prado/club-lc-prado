import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "./Useful.css";
import germanyMapBg from "../germany-map-bg.jpg";

const SPECIALISTS = [
  {
    id: "test1",
    name: "Юрий",
    x: 34.9,
    y: 26.1,
    languages: ["ru", "de"],
    directions: ["Ходовая часть", "Двигатель", "Замена масла"],
    address: "Hansestraße 12, 28217 Bremen",
    phone: "+49 000 000000",
    whatsapp: true,
    telegram: true,
    viber: false,
  },
  {
    id: "test2",
    name: "Иван",
    x: 41.2,
    y: 27.1,
    languages: ["de", "ru", "en"],
    directions: ["Подготовка к TÜV", "Замена шин", "Ремонт"],
    address: "Bahnhofstraße 5, 30159 Hannover",
    phone: "+49 000 000000",
    whatsapp: true,
    telegram: false,
    viber: true,
  },
];

const FLAG_LABELS = { ru: "RU", de: "DE", en: "EN", ua: "UA" };

function Useful() {
  const { t } = useLanguage();
  const [clickPos, setClickPos] = useState(null);
  const [selected, setSelected] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: xPercent, y: yPercent });
    setZoom((z) => {
      const next = z - e.deltaY * 0.002;
      return Math.min(4, Math.max(1, next));
    });
  };

  const handleMapClick = (e) => {
    setSelected(null);
    if (!debugMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x: xPercent.toFixed(1), y: yPercent.toFixed(1) });
  };

  const openCard = (s, e) => {
    e.stopPropagation();
    setSelected(s);
  };

  return (
    <div className="useful-page">
      <h1 className="useful-title">{t.static.useful}</h1>

      <button className="useful-debug-toggle" onClick={() => setDebugMode(!debugMode)}>
        {debugMode ? "Режим меток: ВКЛ" : "Режим меток: выкл"}
      </button>

      <div
        className="useful-map-wrap"
        style={{
          backgroundImage: `url(${germanyMapBg})`,
          transform: `scale(${zoom})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
        onClick={handleMapClick}
        onWheel={handleWheel}
      >
        {SPECIALISTS.map((s) => (
          <div key={s.id}>
            <div
              className="useful-dot"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={(e) => openCard(s, e)}
            >
              <span className="useful-dot-ring"></span>
              <span className="useful-dot-core"></span>
            </div>

            {selected?.id === s.id && (
              <div
                className="useful-card-pop"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="useful-card-close" onClick={() => setSelected(null)}>✕</button>
                <div className="useful-card-name">{s.name}</div>
                <div className="useful-card-langs">
                  {s.languages.map((l, i) => (
                    <span key={i} className={`useful-flag useful-flag-${l}`}>{FLAG_LABELS[l]}</span>
                  ))}
                </div>
                <div className="useful-card-directions">
                  {s.directions.map((d, i) => (
                    <span key={i} className="useful-card-tag">{d}</span>
                  ))}
                </div>
                <div className="useful-card-footer">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="useful-card-address"
                  >
                    📍 {s.address}
                  </a>
                  <div className="useful-card-phone-row">
                    <a href={`tel:${s.phone}`} className="useful-card-phone">{s.phone}</a>
                    <div className="useful-card-messengers">
                      {s.whatsapp && <span className="useful-msg-icon useful-msg-wa">W</span>}
                      {s.telegram && <span className="useful-msg-icon useful-msg-tg">T</span>}
                      {s.viber && <span className="useful-msg-icon useful-msg-vb">V</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {debugMode && clickPos && (
          <div
            className="useful-click-marker"
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
          >
            {clickPos.x}%, {clickPos.y}%
          </div>
        )}
      </div>

      {debugMode && clickPos && (
        <div className="useful-coords-hint">
          Координаты последнего клика: x={clickPos.x}%, y={clickPos.y}%
        </div>
      )}
    </div>
  );
}

export default Useful;