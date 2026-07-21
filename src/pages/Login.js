import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Register.css";
import joinBg from "../auth-bg.jpg";

function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate("/profile");
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
        <h1 className="auth-title">{t.auth.loginTitle}</h1>

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
        />

        <button type="submit" disabled={loading}>
          {loading ? t.auth.loggingIn : t.auth.loginBtn}
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Login;