import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
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

function AccountLinks({ user, onClick }) {
  if (user) {
    return (
      <li>
        <NavLink
          to="/profile"
          onClick={onClick}
          className={({ isActive }) =>
            "sidebar-link sidebar-link-account" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-dot"></span>
          {user.displayName || "Профиль"}
        </NavLink>
      </li>
    );
  }
  return (
    <>
      <li>
        <NavLink
          to="/login"
          onClick={onClick}
          className={({ isActive }) =>
            "sidebar-link sidebar-link-account" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-dot"></span>
          Войти
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/register"
          onClick={onClick}
          className={({ isActive }) =>
            "sidebar-link sidebar-link-account" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-dot"></span>
          Регистрация
        </NavLink>
      </li>
    </>
  );
}

function Sidebar() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

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
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="YouTube">YT</a>
          <a href="#" aria-label="Telegram">TG</a>
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
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="YouTube">YT</a>
            <a href="#" aria-label="Telegram">TG</a>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;