import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "./Useful.css";
import germanyMapBg from "../germany-map-bg.jpg";

function Useful() {
  const { t } = useLanguage();
  const [clickPos, setClickPos] = useState(null);

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x: xPercent.toFixed(1), y: yPercent.toFixed(1) });
  };

  return (
    <div className="useful-page">
      <h1 className="useful-title">{t.static.useful}</h1>

      <div
        className="useful-map-wrap"
        style={{ backgroundImage: `url(${germanyMapBg})` }}
        onClick={handleMapClick}
      >
        {clickPos && (
          <div
            className="useful-click-marker"
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
          >
            {clickPos.x}%, {clickPos.y}%
          </div>
        )}
      </div>

      {clickPos && (
        <div className="useful-coords-hint">
          Координаты последнего клика: x={clickPos.x}%, y={clickPos.y}%
        </div>
      )}
    </div>
  );
}

export default Useful;