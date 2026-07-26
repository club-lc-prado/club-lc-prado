import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "./Useful.css";
import germanyMapBg from "../germany-map-bg.jpg";

const SPECIALISTS = [
  {
    id: "test1",
    name: "Bremen СТО",
    city: "Bremen",
    x: 34.9,
    y: 26.1,
    address: "—",
    description: "Toyota, Lexus, 4x4",
    languages: ["Немецкий", "Русский"],
    phone: "",
    whatsapp: "",
    website: "",
  },
];

function Useful() {
  const { t } = useLanguage();
  const [clickPos, setClickPos] = useState(null);
  const [selected, setSelected] = useState(null);
  const [debugMode, setDebugMode] = useState(false);

  const handleMapClick = (e) => {
    if (!debugMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x: xPercent.toFixed(1), y: yPercent.toFixed(1) });
  };

  return (
    <div className="useful-page">
      <h1 className="useful-title">{t.static.useful}</h1>

      <button className="useful-debug-toggle" onClick={() => setDebugMode(!debugMode)}>
        {debugMode ? "Режим меток: ВКЛ" : "Режим меток: выкл"}
      </button>

      <div
        className="useful-map-wrap"
        style={{ backgroundImage: `url(${germanyMapBg})` }}
        onClick={handleMapClick}
      >
        {SPECIALISTS.map((s) => (
          <div
            key={s.id}
            className="useful-dot"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(s);
            }}
          >
            <span className="useful-dot-ring"></span>
            <span className="useful-dot-core"></span>
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

      {selected && (
        <div className="useful-card-overlay" onClick={() => setSelected(null)}>
          <div className="useful-card" onClick={(e) => e.stopPropagation()}>
            <button className="useful-card-close" onClick={() => setSelected(null)}>✕</button>
            <h2 className="useful-card-name">{selected.name}</h2>
            <div className="useful-card-city">{selected.city}</div>
            {selected.address && <div className="useful-card-row">{selected.address}</div>}
            {selected.description && <div className="useful-card-row">{selected.description}</div>}
            {selected.languages && (
              <div className="useful-card-row">{selected.languages.join(", ")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Useful;