import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Home.css";
import HomeCalendar from "../components/HomeCalendar";
import heroImage from "../hero-prado.jpg";
import notifSound from "../notif-sound.mp3";
import cardFront from "../card-front.jpg";
import cardBack from "../card-back.jpg";

function Home() {
  const { t, lang, changeLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [myStory, setMyStory] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "members", u.uid));
        if (snap.exists()) setProfile(snap.data());
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      const snap = await getDocs(collection(db, "members"));
      setMemberCount(snap.size);
    };
    loadCount();
  }, []);

  useEffect(() => {
    if (!user) return;
    let firstLoad = true;
    const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const unread = snap.docs.filter((d) => {
        const data = d.data();
        return data.lastMessageBy && data.lastMessageBy !== user.uid && !data.readBy?.includes(user.uid);
      });
      const newCount = unread.length;

      setUnreadChats((prevCount) => {
        if (!firstLoad && newCount > prevCount) {
          new Audio(notifSound).play().catch(() => {});
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        return newCount;
      });

      firstLoad = false;
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const q = query(collection(db, "stories"), where("authorId", "==", user.uid));
      const snap = await getDocs(q);
      const now = Date.now();
      const active = snap.docs
        .map((d) => d.data())
        .filter((s) => now - new Date(s.createdAt).getTime() < 24 * 60 * 60 * 1000);
      if (active.length === 0) {
        setMyStory(null);
      } else {
        const hasUnviewed = active.some((s) => !s.viewedBy?.includes(user.uid));
        setMyStory({ hasUnviewed, viewedBy: hasUnviewed ? [] : [user.uid] });
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const nq = query(collection(db, "notifications"), where("toUserId", "==", user.uid), where("read", "==", false));
    const unsub = onSnapshot(nq, (snap) => {
      setUnreadNotifs(snap.size);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const total = unreadChats + unreadNotifs;
    if ("setAppBadge" in navigator) {
      if (total > 0) navigator.setAppBadge(total).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadChats, unreadNotifs]);

  const isMeOnline = profile?.lastActive && (Date.now() - new Date(profile.lastActive).getTime()) < 120000;

  const closeCard = () => {
    setCardOpen(false);
    setCardFlipped(false);
  };

  return (
    <div className="hero">
      <div className="hero-bg" style={{ backgroundImage: `url(${heroImage})` }}></div>
      <div className="hero-overlay"></div>

      <div className="lang-switch">
        <button className={lang === "ru" ? "active" : ""} onClick={() => changeLang("ru")}>RU</button>
        <button className={lang === "de" ? "active" : ""} onClick={() => changeLang("de")}>DE</button>
        <button className={lang === "en" ? "active" : ""} onClick={() => changeLang("en")}>EN</button>
        <button className={lang === "ua" ? "active" : ""} onClick={() => changeLang("ua")}>UA</button>
      </div>

      <div className="home-calendar-standalone">
        <HomeCalendar />
      </div>

      <button type="button" className="hero-title-block hero-title-clickable" onClick={() => setCardOpen(true)}>
        <div className="hero-eyebrow">TOYOTA</div>
        <h1 className="hero-title">PRADO</h1>
        <div className="hero-sub-label">CLUB</div>
        <div className="hero-tagline">{t.home.eyebrow}</div>
      </button>

      {cardOpen && (
        <div className="qr-modal-overlay" onClick={closeCard}>
          <div className="qr-modal card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flip-card" onClick={() => setCardFlipped((f) => !f)}>
              <div className={"flip-card-inner" + (cardFlipped ? " flipped" : "")}>
                <div className="flip-card-front">
                  <img src={cardFront} alt="Визитка клуба" />
                </div>
                <div className="flip-card-back">
                  <img src={cardBack} alt="QR-код" />
                </div>
              </div>
            </div>
            <div className="qr-modal-text">Нажми на визитку, чтобы перевернуть</div>
            <button className="qr-modal-close" onClick={closeCard}>Закрыть</button>
          </div>
        </div>
      )}

      <div className="hero-content">
        <h2 className="hero-slogan">
          {t.home.titleLines.map((line, i) => (
            <span key={i} className="hero-slogan-line">{line}</span>
          ))}
        </h2>
        <div className="hero-underline"></div>
        <p className="hero-subtitle">{t.home.subtitle}</p>
      </div>

      <div className="hero-strip">
        <div className="hero-strip-left">
        <Link to={user ? "/feed" : "/login"} className="hero-strip-account">
          <div className={"hero-strip-avatar-wrap" + (myStory ? (myStory.viewedBy?.includes(user?.uid) ? " story-ring viewed" : " story-ring unviewed") : "")}>
            <div className="hero-strip-avatar">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="avatar" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            {isMeOnline && <span className="online-dot"></span>}
            {(unreadChats + unreadNotifs) > 0 && (
              <span className="hero-strip-badge">{unreadChats + unreadNotifs}</span>
            )}
          </div>
          <div className="hero-strip-account-text">
            <span className="hero-strip-account-name">
              {profile?.name || t.feed.guest}
            </span>
            <span className="hero-strip-account-sub">
              {user ? t.home.feedLink : t.home.loginLink}
            </span>
          </div>
        </Link>

        <div className="hero-strip-cards">
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMeeting}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
          <Link to="/members" className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardMembers}</span>
            <span className="hero-strip-card-value">{memberCount ?? "—"}</span>
          </Link>
          <div className="hero-strip-card">
            <span className="hero-strip-card-label">{t.home.cardTrip}</span>
            <span className="hero-strip-card-value">—</span>
          </div>
        </div>

        <div className="hero-strip-tag">{t.home.tagline}</div>
        </div>

        <div className="hero-strip-calendar-mobile">
          <HomeCalendar />
        </div>
      </div>
    </div>
  );
}

export default Home;