import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="auth-page">
        <div className="auth-bg-fixed" style={{ backgroundImage: `url(${joinBg})` }}></div>
        <div className="auth-bg-overlay"></div>
        <form className="auth-form" onSubmit={handleReset}>
          <h1 className="auth-title">{t.auth.resetTitle}</h1>

          {resetSent ? (
            <div className="auth-notice">{t.auth.resetSent}</div>
          ) : (
            <>
              <input
                type="email"
                name="email"
                placeholder={t.auth.emailPlaceholder}
                value={form.email}
                onChange={handleChange}
                required
              />
              <button type="submit" disabled={loading}>
                {t.auth.sendReset}
              </button>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-switch">
            <a href="#" onClick={(e) => { e.preventDefault(); setResetMode(false); setResetSent(false); setError(""); }}>
              {t.auth.loginTitle}
            </a>
          </div>
        </form>
      </div>
    );
  }

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

        <div className="auth-switch">
          <a href="#" onClick={(e) => { e.preventDefault(); setResetMode(true); setError(""); }}>
            {t.auth.forgotPassword}
          </a>
        </div>

        <div className="auth-switch">
          {t.auth.noAccount} <Link to="/register">{t.auth.registerBtn}</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;