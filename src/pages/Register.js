import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Register.css";
import joinBg from "../auth-bg.jpg";

function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", city: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });

      await setDoc(doc(db, "members", cred.user.uid), {
        name: form.name,
        city: form.city,
        email: form.email,
        prado: "",
        bio: "",
        photoURL: "",
        visibleInCatalog: true,
        showCity: true,
        createdAt: new Date().toISOString(),
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-fixed" style={{ backgroundImage: `url(${joinBg})` }}></div>
      <div className="auth-bg-overlay"></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">{t.auth.registerTitle}</h1>
        <p className="auth-notice">{t.auth.notice}</p>

        <input
          type="text"
          name="name"
          placeholder={t.auth.namePlaceholder}
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="city"
          placeholder={t.auth.cityPlaceholder}
          value={form.city}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder={t.auth.emailPlaceholder}
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder={t.auth.passwordPlaceholder}
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? t.auth.creating : t.auth.registerBtn}
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Register;