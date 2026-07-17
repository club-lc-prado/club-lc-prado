import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Register.css";
import joinBg from "../auth-bg.jpg";

function Register() {
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
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-notice">
          Другие участники клуба смогут видеть твой профиль в каталоге. Это можно отключить в любой момент в настройках профиля.
        </p>

        <input
          type="text"
          name="name"
          placeholder="Имя"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="city"
          placeholder="Город"
          value={form.city}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Создаём..." : "Зарегистрироваться"}
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Register;