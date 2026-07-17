import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Register.css";
import joinBg from "../auth-bg.jpg";

function Login() {
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
        <h1 className="auth-title">Вход</h1>

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
        />

        <button type="submit" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>

        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Login;