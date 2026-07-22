import { Link } from "react-router-dom";
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

      <div className="contacts-footer">
        <div className="contacts-footer-links">
          <Link to="/privacy">{t.contactsFooter.privacy}</Link>
          <span>·</span>
          <Link to="/terms">{t.contactsFooter.terms}</Link>
        </div>
        <div className="contacts-footer-copy">{t.contactsFooter.copyright}</div>
      </div>
    </div>
  );
}

export default Contacts;