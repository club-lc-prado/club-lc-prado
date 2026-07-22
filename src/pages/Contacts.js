import "./TechInfo.css";
import contactsBg from "../contacts-bg.jpg";
import { useLanguage } from "../i18n/LanguageContext";

function Contacts() {
  const { t } = useLanguage();
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${contactsBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">{t.nav.contacts}</h1>
    </div>
  );
}

export default Contacts;