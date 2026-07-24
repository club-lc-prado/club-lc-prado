import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Messages.css";

function Messages() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

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
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      setConversations(list);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "short" });
  };

  const otherParticipant = (conv) => {
    const otherId = conv.participants.find((p) => p !== user.uid);
    return {
      id: otherId,
      name: conv.participantNames?.[otherId] || "?",
      photo: conv.participantPhotos?.[otherId] || "",
    };
  };

  return (
    <div className="messages-page">
      <Link to="/feed" className="messages-back">{t.settings.backToFeed}</Link>
      <h1 className="messages-title">{t.messages.pageTitle}</h1>
      <div className="messages-underline"></div>

      {loading && <div className="messages-empty">...</div>}

      {!loading && conversations.length === 0 && (
        <div className="messages-empty">{t.messages.empty}</div>
      )}

      {!loading && conversations.length > 0 && (
        <div className="messages-list">
          {conversations.map((conv) => {
            const other = otherParticipant(conv);
            const unread = conv.lastMessageBy && conv.lastMessageBy !== user.uid && !conv.readBy?.includes(user.uid);
            return (
              <Link to={`/messages/${other.id}`} key={conv.id} className={"messages-item" + (unread ? " unread" : "")}>
                <div className="messages-avatar">
                  {other.photo ? (
                    <img src={other.photo} alt={other.name} />
                  ) : (
                    other.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div className="messages-item-body">
                  <div className="messages-item-name">{other.name}</div>
                  <div className="messages-item-last">{conv.lastMessage}</div>
                </div>
                <div className="messages-item-date">{formatDate(conv.lastMessageAt)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Messages;