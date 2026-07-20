import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Journeys.css";

function NewJourney() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ title: "", date: "", place: "", description: "" });
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
      await addDoc(collection(db, "journeys"), {
        ...form,
        createdBy: user.uid,
        createdByName: profile?.name || "Участник",
        participants: [user.uid],
        createdAt: new Date().toISOString(),
      });
      navigate("/journeys");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="journeys-page">
      <h1 className="journeys-title">{t.journeys.newTitle}</h1>
      <div className="journeys-underline"></div>

      <form className="journey-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder={t.journeys.titlePlaceholder}
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="place"
          placeholder={t.journeys.placePlaceholder}
          value={form.place}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder={t.journeys.descPlaceholder}
          value={form.description}
          onChange={handleChange}
          rows={5}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? t.journeys.publishing : t.journeys.publishBtn}
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default NewJourney;