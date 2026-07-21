import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Forum.css";
import forumBg from "../forum-bg.jpg";

function Forum() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "topics"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "short" });
  };

  return (
    <div className="forum-page">
      <div className="forum-bg-fixed" style={{ backgroundImage: `url(${forumBg})` }}></div>
      <div className="forum-bg-overlay"></div>

      <div className="forum-header">
        <div>
          <h1 className="forum-title">{t.forum.pageTitle}</h1>
          <div className="forum-underline"></div>
          <p className="forum-intro">{t.forum.introText}</p>
        </div>
        <Link to={user ? "/forum/new" : "/login"} className="forum-new-btn">
          {t.forum.newTopicBtn}
        </Link>
      </div>

      {loading && <div className="forum-empty">{t.forum.loading}</div>}

      {!loading && topics.length === 0 && (
        <div className="forum-empty">{t.forum.emptyList}</div>
      )}

      {!loading && topics.length > 0 && (
        <div className="forum-list">
          {topics.map((tp) => (
            <Link to={`/forum/${tp.id}`} key={tp.id} className="forum-topic-card">
              <div className="forum-topic-title">{tp.title}</div>
              <div className="forum-topic-meta">
                <span>{tp.authorName}</span>
                <span>{formatDate(tp.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Forum;