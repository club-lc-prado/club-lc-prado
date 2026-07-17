import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ city: "", prado: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "members", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setForm({ city: data.city || "", prado: data.prado || "", bio: data.bio || "" });
      }
      setLoading(false);
    });
    return unsub;
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await updateDoc(doc(db, "members", user.uid), form);
    setProfile({ ...profile, ...form });
    setEditing(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    try {
      await deleteDoc(doc(db, "members", user.uid));
      await deleteUser(user);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setDeleteError("Нужно недавно войти заново, чтобы удалить аккаунт. Выйди и войди снова, затем повтори.");
      } else {
        setDeleteError(err.message);
      }
    }
  };

  if (loading) {
    return <div className="profile-page"></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{profile?.name?.[0]?.toUpperCase() || "?"}</div>
        <h1 className="profile-name">{profile?.name}</h1>
        <div className="profile-city">{profile?.city}</div>

        {!editing ? (
          <>
            <div className="profile-field">
              <span className="profile-label">Prado</span>
              <span>{profile?.prado || "не указано"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">О себе</span>
              <span>{profile?.bio || "не указано"}</span>
            </div>
            <button className="profile-btn" onClick={() => setEditing(true)}>
              Редактировать
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              name="city"
              placeholder="Город"
              value={form.city}
              onChange={handleChange}
            />
            <input
              type="text"
              name="prado"
              placeholder="Модель Prado"
              value={form.prado}
              onChange={handleChange}
            />
            <textarea
              name="bio"
              placeholder="О себе"
              value={form.bio}
              onChange={handleChange}
              rows={3}
            />
            <button className="profile-btn" onClick={handleSave}>
              Сохранить
            </button>
          </>
        )}

        <button className="profile-logout" onClick={handleLogout}>
          Выйти
        </button>

        {!confirmDelete ? (
          <button className="profile-delete" onClick={() => setConfirmDelete(true)}>
            Удалить аккаунт
          </button>
        ) : (
          <div className="profile-delete-confirm">
            <div className="profile-delete-text">
              Это удалит аккаунт навсегда. Точно?
            </div>
            <div className="profile-delete-actions">
              <button className="profile-delete-yes" onClick={handleDeleteAccount}>
                Да, удалить
              </button>
              <button className="profile-delete-no" onClick={() => setConfirmDelete(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {deleteError && <div className="auth-error">{deleteError}</div>}
      </div>
    </div>
  );
}

export default Profile;