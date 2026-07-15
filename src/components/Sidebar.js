import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

const navItems = [
  { to: "/", key: "home" },
  { to: "/news", key: "news" },
  { to: "/forum", key: "forum" },
  { to: "/gallery", key: "gallery" },
  { to: "/tech-info", key: "techInfo" },
  { to: "/journeys", key: "journeys" },
  { to: "/clubs", key: "clubs" },
  { to: "/shop", key: "shop" },
  { to: "/contacts", key: "contacts" },
];

function Sidebar() {
  const { t } = useLanguage();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        LC
        <span>PRADO CLUB</span>
      </div>

      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.key}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "")
              }
            >
              <span className="sidebar-dot"></span>
              {t.nav[item.key]}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar-social">
        <a href="#" aria-label="Instagram">IG</a>
        <a href="#" aria-label="YouTube">YT</a>
        <a href="#" aria-label="Telegram">TG</a>
      </div>
    </nav>
  );
}

export default Sidebar;