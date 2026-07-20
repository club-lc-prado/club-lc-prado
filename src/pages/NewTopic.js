import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Forum.css";

function NewTopic() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "topics"), {
        title: form.title,
        description: form.description,
        authorId: user.uid,
        authorName: profile?.name || "Участник",
        createdAt: new Date().toISOString(),
      });
      navigate(`/forum/${docRef.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forum-page">
      <h1 className="forum-title">Открыть тему</h1>
      <div className="forum-underline"></div>

      <form className="forum-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="О чём поговорим? (заголовок темы)"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Опиши подробнее, чтобы люди понимали, что обсуждаем"
          value={form.description}
          onChange={handleChange}
          rows={5}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Публикуем..." : "Открыть тему"}
        </button>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default NewTopic;