import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

const navItems = [
  { to: "/", key: "home" },
  { to: "/about", key: "about" },
  { to: "/news", key: "news" },
  { to: "/gallery", key: "gallery" },
  { to: "/tech-info", key: "techInfo" },
  { to: "/journeys", key: "journeys" },
  { to: "/shop", key: "shop" },
  { to: "/contacts", key: "contacts" },
  { to: "/forum", key: "forum" },
];

function Sidebar() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const replayIntro = () => {
    localStorage.removeItem("club_lc_prado_boot_seen");
    window.location.reload();
  };

  return (
    <>
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

        <button className="sidebar-replay" onClick={replayIntro}>
          ▶ INTRO
        </button>

        <div className="sidebar-social">
          <button aria-label="Instagram">IG</button>
          <button aria-label="YouTube">YT</button>
          <button aria-label="Telegram">TG</button>
        </div>
      </nav>

      <div className="mobile-topbar">
        <div className="mobile-topbar-logo">
          LC <span>PRADO CLUB</span>
        </div>
        <button
          className={"hamburger" + (menuOpen ? " open" : "")}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeMenu}
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
          <button className="sidebar-replay" onClick={replayIntro}>
            ▶ INTRO
          </button>
          <div className="sidebar-social">
            <button aria-label="Instagram">IG</button>
            <button aria-label="YouTube">YT</button>
            <button aria-label="Telegram">TG</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;