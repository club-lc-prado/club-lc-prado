import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Settings.css";

function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

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
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const textFor = (n) => {
    if (n.type === "like") return `${n.fromUserName} оценил(а) твой пост`;
    if (n.type === "comment") return `${n.fromUserName} прокомментировал(а) твой клич "${n.journeyTitle}"`;
    if (n.type === "rsvp") return `${n.fromUserName} присоединился(лась) к твоему кличу "${n.journeyTitle}"`;
    return n.fromUserName;
  };

  const linkFor = (n) => {
    if (n.type === "like") return "/feed";
    if (n.journeyId) return `/journeys/${n.journeyId}`;
    return "/feed";
  };

  return (
    <div className="settings-page">
      <Link to="/feed" className="settings-back">← Назад в ленту</Link>

      <h1 className="settings-title">Уведомления</h1>
      <div className="settings-underline"></div>

      <div className="settings-section">
        {items.length === 0 && (
          <div className="settings-row-sub">Пока пусто.</div>
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