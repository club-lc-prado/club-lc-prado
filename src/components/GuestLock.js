import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "./GuestLock.css";

function GuestLock({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="guest-lock-page"></div>;

  if (!user) {
    return (
      <div className="guest-lock-page">
        <div className="guest-lock-box">
          <div className="guest-lock-title">Этот раздел доступен участникам клуба</div>
          <p className="guest-lock-text">
            Зарегистрируйся или войди, чтобы получить доступ.
          </p>
          <div className="guest-lock-actions">
            <Link to="/register" className="guest-lock-btn">Регистрация</Link>
            <Link to="/login" className="guest-lock-btn secondary">Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default GuestLock;