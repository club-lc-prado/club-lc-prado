import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Messages.css";

function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function Conversation() {
  const { t } = useLanguage();
  const { userId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const convId = user ? getConversationId(user.uid, userId) : null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "members", u.uid));
      if (snap.exists()) setProfile(snap.data());
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "members", userId));
      if (snap.exists()) setOtherUser({ id: userId, ...snap.data() });
      setLoading(false);
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (!convId) return;
    const q = query(collection(db, "conversations", convId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!convId || !user) return;
    updateDoc(doc(db, "conversations", convId), {
      readBy: arrayUnion(user.uid),
    }).catch(() => {});
  }, [convId, user, messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user || !otherUser) return;

    const convRef = doc(db, "conversations", convId);
    const convSnap = await getDoc(convRef);
    const now = new Date().toISOString();

    if (!convSnap.exists()) {
      await setDoc(convRef, {
        participants: [user.uid, userId],
        participantNames: {
          [user.uid]: profile?.name || "Участник",
          [userId]: otherUser.name || "Участник",
        },
        participantPhotos: {
          [user.uid]: profile?.photoURL || "",
          [userId]: otherUser.photoURL || "",
        },
        lastMessage: text.trim(),
        lastMessageAt: now,
        lastMessageBy: user.uid,
        readBy: [user.uid],
      });
    } else {
      await updateDoc(convRef, {
        lastMessage: text.trim(),
        lastMessageAt: now,
        lastMessageBy: user.uid,
        readBy: [user.uid],
      });
    }

    await addDoc(collection(db, "conversations", convId, "messages"), {
      text: text.trim(),
      senderId: user.uid,
      createdAt: now,
    });

    setText("");
  };

  if (loading) return <div className="messages-page"></div>;
  if (!otherUser) return <div className="messages-page">{t.members.notFound}</div>;

  return (
    <div className="messages-page conversation-page">
      <div className="conversation-back-row">
        <Link to="/messages" className="messages-back">{t.messages.backToAll}</Link>
        <Link to="/feed" className="messages-back">{t.settings.backToFeed}</Link>
      </div>

      <div className="conversation-header">
        <div className="messages-avatar">
          {otherUser.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.name} />
          ) : (
            otherUser.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="conversation-header-name">{otherUser.name}</div>
      </div>

      <div className="conversation-thread">
        {messages.length === 0 && (
          <div className="messages-empty">{t.messages.noMessagesYet}</div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.uid;
          const avatarUrl = mine ? profile?.photoURL : otherUser?.photoURL;
          const avatarName = mine ? profile?.name : otherUser?.name;
          return (
            <div key={m.id} className={"conversation-row" + (mine ? " mine" : "")}>
              <div className="conversation-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={avatarName} />
                ) : (
                  avatarName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="conversation-bubble-col">
                <div className="conversation-msg-name">{avatarName}</div>
                <div className="conversation-bubble-row">
                  <div className="conversation-bubble">
                    {m.text}
                  </div>
                  {mine && (
                    <button
                      className="conversation-delete-btn"
                      onClick={() => deleteDoc(doc(db, "conversations", convId, "messages", m.id))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      <div className="conversation-security-notice">{t.messages.securityNotice}</div>

      <form onSubmit={handleSend} className="conversation-form">
        <input
          type="text"
          placeholder={t.messages.writeMsg}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()}>{t.messages.send}</button>
      </form>
    </div>
  );
}

export default Conversation;