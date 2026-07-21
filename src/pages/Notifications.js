import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, onSnapshot, doc, writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Settings.css";

function Notifications() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(list);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || items.length === 0) return;
    const unread = items.filter((i) => !i.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((i) => {
      batch.update(doc(db, "notifications", i.id), { read: true });
    });
    batch.commit();
  }, [user, items]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const textFor = (n) => {
    if (n.type === "like") return `${n.fromUserName} ${t.feed.likedYourPost}`;
    if (n.type === "comment") return `${n.fromUserName} ${t.feed.commentedTopic} "${n.journeyTitle}"`;
    if (n.type === "postComment") return `${n.fromUserName} ${t.feed.commentedYourPost}`;
    if (n.type === "rsvp") return `${n.fromUserName} ${t.feed.joinedCall} "${n.journeyTitle}"`;
    return n.fromUserName;
  };

  const linkFor = (n) => {
    if (n.journeyId) return `/journeys/${n.journeyId}`;
    return "/feed";
  };

  return (
    <div className="settings-page">
      <Link to="/feed" className="settings-back">{t.settings.backToFeed}</Link>

      <h1 className="settings-title">{t.notifications.title}</h1>
      <div className="settings-underline"></div>

      <div className="settings-section">
        {items.length === 0 && (
          <div className="settings-row-sub">{t.notifications.empty}</div>
        )}
        {items.map((n) => (
          <Link
            key={n.id}
            to={linkFor(n)}
            className="settings-row"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div>
              <div className="settings-row-label">{textFor(n)}</div>
              <div className="settings-row-sub">{formatDate(n.createdAt)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Notifications;