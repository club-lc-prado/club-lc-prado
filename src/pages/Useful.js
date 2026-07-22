import { useLanguage } from "../i18n/LanguageContext";
import "./TechInfo.css";
import techInfoBg from "../techinfo-bg.jpg";

function Useful() {
  const { t } = useLanguage();
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${techInfoBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">{t.static.useful}</h1>
    </div>
  );
}

export default Useful;