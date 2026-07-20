import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Forum.css";
import forumBg from "../forum-bg.jpg";

function Forum() {
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  };

  return (
    <div className="forum-page">
      <div className="forum-bg-fixed" style={{ backgroundImage: `url(${forumBg})` }}></div>
      <div className="forum-bg-overlay"></div>

      <div className="forum-header">
        <div>
          <h1 className="forum-title">Форум</h1>
          <div className="forum-underline"></div>
          <p className="forum-intro">
            Открой тему — расскажи, что хочешь обсудить, и позови остальных присоединиться.
          </p>
        </div>
        <Link to={user ? "/forum/new" : "/login"} className="forum-new-btn">
          + Открыть тему
        </Link>
      </div>

      {loading && <div className="forum-empty">Загрузка...</div>}

      {!loading && topics.length === 0 && (
        <div className="forum-empty">Пока пусто. Стань первым, кто откроет тему.</div>
      )}

      {!loading && topics.length > 0 && (
        <div className="forum-list">
          {topics.map((t) => (
            <Link to={`/forum/${t.id}`} key={t.id} className="forum-topic-card">
              <div className="forum-topic-title">{t.title}</div>
              <div className="forum-topic-meta">
                <span>{t.authorName}</span>
                <span>{formatDate(t.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Forum;