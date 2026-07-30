import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import { Check, CheckCheck } from "lucide-react";
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
  const [nowTick, setNowTick] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [convData, setConvData] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
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
      const real = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages((prev) => {
        const stillPending = prev.filter(
          (m) => m.id.startsWith("temp-") && !real.some((r) => r.text === m.text && r.senderId === m.senderId)
        );
        return [...real, ...stillPending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    });
    return unsub;
  }, [convId]);

  useEffect(() => {
    if (!convId) return;
    const unsub = onSnapshot(doc(db, "conversations", convId), (snap) => {
      if (snap.exists()) setConvData(snap.data());
    });
    return unsub;
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const isOtherOnline = otherUser?.lastActive && (nowTick - new Date(otherUser.lastActive).getTime()) < 120000;

  useEffect(() => {
    if (!convId || !user) return;
    updateDoc(doc(db, "conversations", convId), {
      readBy: arrayUnion(user.uid),
      [`lastReadAt.${user.uid}`]: new Date().toISOString(),
    }).catch(() => {});
  }, [convId, user, messages.length]);

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    await addDoc(collection(db, "reports"), {
      reportedBy: user.uid,
      reportedByName: profile?.name || "Участник",
      conversationId: convId,
      otherUserId: userId,
      otherUserName: otherUser?.name || "",
      reason: reportReason.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setReportSent(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSent(false);
      setReportReason("");
    }, 1500);
  };

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

    const sentText = text.trim();
    setMessages((prev) => [...prev, { id: "temp-" + now, text: sentText, senderId: user.uid, createdAt: now }]);

    await addDoc(collection(db, "conversations", convId, "messages"), {
      text: sentText,
      senderId: user.uid,
      createdAt: now,
    });

    fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: userId,
        title: profile?.name || "Club LC Prado",
        body: text.trim(),
      }),
    }).catch(() => {});

    setText("");
  };

  if (loading) return <div className="messages-page"></div>;
  if (!otherUser) return <div className="messages-page">{t.members.notFound}</div>;

  return (
    <div className="messages-page conversation-page">
      <div className="conversation-back-row">
        <Link to="/messages" className="messages-back">{t.messages.backToAll}</Link>
        <Link to="/feed" className="messages-back">{t.settings.backToFeed}</Link>
        <button className="conversation-report-btn" onClick={() => setReportOpen(true)}>⚑ Пожаловаться</button>
      </div>

      {reportOpen && (
        <div className="admin-map-overlay" onClick={() => setReportOpen(false)}>
          <div className="spec-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="useful-card-close" onClick={() => setReportOpen(false)}>✕</button>
            <div className="spec-form-title">Пожаловаться на переписку</div>
            <textarea
              className="conversation-report-textarea"
              placeholder="Опиши, что не так в этом диалоге"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
            <button
              className="profile-btn-small"
              disabled={!reportReason.trim() || reportSent}
              onClick={submitReport}
            >
              {reportSent ? "Жалоба отправлена" : "Отправить жалобу администратору"}
            </button>
          </div>
        </div>
      )}

      <div className="conversation-header">
        <div className="messages-avatar-wrap">
          <div className="messages-avatar">
            {otherUser.photoURL ? (
              <img src={otherUser.photoURL} alt={otherUser.name} />
            ) : (
              otherUser.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          {isOtherOnline && <span className="online-dot"></span>}
        </div>
        <div className="conversation-header-name">
          {otherUser.name}
          {isOtherOnline && <span className="online-text">в сети</span>}
        </div>
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
              <div className="conversation-avatar-outer">
                <div className="conversation-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={avatarName} />
                  ) : (
                    avatarName?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                {(mine || isOtherOnline) && <span className="online-dot msg"></span>}
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
                {mine && (() => {
                  const theirReadAt = convData?.lastReadAt?.[userId];
                  const isRead = theirReadAt && new Date(theirReadAt) >= new Date(m.createdAt);
                  return (
                    <div className={"read-receipt" + (isRead ? " read" : "")}>
                      {isRead ? <CheckCheck size={13} /> : <Check size={13} />}
                    </div>
                  );
                })()}
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