import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, addDoc, query, orderBy, onSnapshot,
  arrayUnion, arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Journeys.css";

function JourneyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [journey, setJourney] = useState(null);
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
      const snap = await getDoc(doc(db, "journeys", id));
      if (snap.exists()) setJourney({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    load();

    const q = query(collection(db, "journeys", id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [id]);

  const isGoing = journey?.participants?.includes(user?.uid);

  const toggleGoing = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const ref = doc(db, "journeys", id);
    if (isGoing) {
      await updateDoc(ref, { participants: arrayRemove(user.uid) });
      setJourney({ ...journey, participants: journey.participants.filter((p) => p !== user.uid) });
    } else {
      await updateDoc(ref, { participants: arrayUnion(user.uid) });
      setJourney({ ...journey, participants: [...(journey.participants || []), user.uid] });
    }
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "journeys", id));
    navigate("/journeys");
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }
    await addDoc(collection(db, "journeys", id, "comments"), {
      text: commentText,
      authorName: profile?.name || "Участник",
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  };

  if (loading) return <div className="journeys-page"></div>;
  if (!journey) return <div className="journeys-page">Клич не найден.</div>;

  return (
    <div className="journeys-page">
      <Link to="/journeys" className="journey-back">← Все путешествия</Link>

      <h1 className="journeys-title" style={{ marginTop: 16 }}>{journey.title}</h1>
      <div className="journeys-underline"></div>

      <div className="journey-detail-meta">
        <span>{formatDate(journey.date)}</span>
        <span>{journey.place}</span>
        <span>Автор: {journey.createdByName}</span>
      </div>

      <p className="journey-detail-description">{journey.description}</p>

      <div className="journey-participants">
        Едут: {journey.participants?.length || 0}
      </div>

      <div className="journey-actions">
        <button className="journeys-btn" onClick={toggleGoing}>
          {isGoing ? "Не поеду" : "Я поеду"}
        </button>
        {user?.uid === journey.createdBy && (
          <button className="journeys-btn-outline" onClick={handleDelete}>
            Удалить клич
          </button>
        )}
      </div>

      <div className="journey-comments">
        <div className="journeys-section-label">Обсуждение</div>

        {comments.map((c) => (
          <div key={c.id} className="journey-comment">
            <div className="journey-comment-author">{c.authorName}</div>
            <div className="journey-comment-text">{c.text}</div>
          </div>
        ))}

        <form onSubmit={handleComment} className="journey-comment-form">
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

export default JourneyDetail;