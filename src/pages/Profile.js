import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Profile.css";
import joinBg from "../join-bg.jpg";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const dragState = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ city: "", prado: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [cropSrc, setCropSrc] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const CIRCLE = 260;

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setImgSize({ w: img.width, h: img.height });
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setCropSrc(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const baseScale = () => {
    if (!imgSize.w) return 1;
    return Math.max(CIRCLE / imgSize.w, CIRCLE / imgSize.h);
  };

  const startDrag = (clientX, clientY) => {
    dragState.current = { startX: clientX, startY: clientY, startOffset: offset };
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState.current) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    setOffset({
      x: dragState.current.startOffset.x + dx,
      y: dragState.current.startOffset.y + dy,
    });
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const handleSaveCrop = async () => {
    const scale = baseScale() * zoom;
    const canvas = document.createElement("canvas");
    canvas.width = CIRCLE;
    canvas.height = CIRCLE;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = async () => {
      ctx.save();
      ctx.translate(CIRCLE / 2 + offset.x, CIRCLE / 2 + offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2);
      ctx.restore();

      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      await updateDoc(doc(db, "members", user.uid), { photoURL: base64 });
      setProfile({ ...profile, photoURL: base64 });
      setCropSrc(null);
    };
    img.src = cropSrc;
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

  if (cropSrc) {
    const scale = baseScale() * zoom;
    return (
      <div className="profile-page">
        <div className="crop-modal">
          <div
            className="crop-circle"
            style={{ width: CIRCLE, height: CIRCLE }}
            onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
            onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={endDrag}
          >
            <img
              ref={imgRef}
              src={cropSrc}
              alt="crop"
              draggable={false}
              style={{
                width: imgSize.w * scale,
                height: imgSize.h * scale,
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                pointerEvents: "none",
              }}
            />
          </div>

          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="crop-zoom"
          />

          <div className="crop-actions">
            <button className="profile-btn" onClick={handleSaveCrop}>
              Сохранить фото
            </button>
            <button className="profile-delete-no" onClick={() => setCropSrc(null)}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-badge-bg" style={{ backgroundImage: `url(${joinBg})` }}></div>
      <div className="profile-badge-overlay"></div>

      <div className="profile-card">
        <div className="profile-avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="avatar" />
          ) : (
            profile?.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

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