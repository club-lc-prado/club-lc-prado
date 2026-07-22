import { useLanguage } from "../i18n/LanguageContext";
import "./TechInfo.css";
import shopBg from "../shop-bg.jpg";

function Shop() {
  const { t } = useLanguage();
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${shopBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">{t.static.shop}</h1>
    </div>
  );
}

export default Shop;