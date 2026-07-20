import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Forum.css";

function TopicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

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
    const load = async () => {
      const snap = await getDoc(doc(db, "topics", id));
      if (snap.exists()) setTopic({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    load();

    const q = query(collection(db, "topics", id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Удалить эту тему навсегда?")) return;
    await deleteDoc(doc(db, "topics", id));
    navigate("/forum");
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }
    await addDoc(collection(db, "topics", id, "comments"), {
      text: commentText,
      authorName: profile?.name || "Участник",
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="forum-page"></div>;
  if (!topic) return <div className="forum-page">Тема не найдена.</div>;

  return (
    <div className="forum-page">
      <Link to="/forum" className="forum-back">← Все темы</Link>

      <h1 className="forum-title" style={{ marginTop: 16 }}>{topic.title}</h1>
      <div className="forum-underline"></div>

      <div className="forum-topic-detail-meta">
        <span>Автор: {topic.authorName}</span>
        <span>{formatDate(topic.createdAt)}</span>
      </div>

      <p className="forum-topic-description">{topic.description}</p>

      {user?.uid === topic.authorId && (
        <button className="forum-delete-btn" onClick={handleDelete}>
          Удалить тему
        </button>
      )}

      <div className="forum-comments">
        <div className="forum-section-label">Обсуждение</div>

        {comments.map((c) => (
          <div key={c.id} className="forum-comment">
            <div className="forum-comment-author">{c.authorName}</div>
            <div className="forum-comment-text">{c.text}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="forum-empty">Пока никто не ответил.</div>
        )}

        <form onSubmit={handleComment} className="forum-comment-form">
          <input
            type="text"
            placeholder={user ? "Написать сообщение..." : "Войди, чтобы написать"}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!user}
          />
          <button type="submit" disabled={!user}>Отправить</button>
        </form>
      </div>
    </div>
  );
}

export default TopicDetail;