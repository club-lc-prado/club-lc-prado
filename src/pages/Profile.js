import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import {
  doc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, orderBy,
  onSnapshot, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Profile.css";
import joinBg from "../join-bg.jpg";
import specialistEmblem from "../specialist-emblem.jpg";

const HeartIcon = ({ filled, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="pgHeartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff6b5e" />
        <stop offset="100%" stopColor="#c0392b" />
      </linearGradient>
    </defs>
    <path
      d="M12,21.35 L10.55,20.03 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,12.28 18.6,15.36 13.45,20.04 L12,21.35 Z"
      fill={filled ? "url(#pgHeartGrad)" : "none"}
      stroke={filled ? "#c0392b" : "#8a8578"}
      strokeWidth="1.5"
    />
  </svg>
);

function Profile() {
  const { t, lang } = useLanguage();
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
  const [myPosts, setMyPosts] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxComments, setLightboxComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [cropSrc, setCropSrc] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const [specTooltip, setSpecTooltip] = useState(false);
  const [specFormOpen, setSpecFormOpen] = useState(false);
  const [specSubmitted, setSpecSubmitted] = useState(false);
  const DIRECTION_OPTIONS = t.specialist.directions;

  const [specForm, setSpecForm] = useState({
    languages: [],
    directions: [],
    address: "",
    phone: "",
    whatsapp: false,
    telegram: false,
    viber: false,
    signal: false,
  });

  const CIRCLE = 260;
  const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "members", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setForm((f) => (editing ? f : { city: data.city || "", prado: data.prado || "", bio: data.bio || "" }));
      }
      setLoading(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "posts"), where("authorId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.image);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyPosts(list);
      if (lightbox) {
        const updated = list.find((p) => p.id === lightbox.id);
        setLightbox(updated || null);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!lightbox) return;
    const q = query(
      collection(db, "posts", lightbox.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLightboxComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [lightbox?.id]);

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
        setDeleteError(t.profile.requiresRecentLogin);
      } else {
        setDeleteError(err.message);
      }
    }
  };

  const toggleLightboxLike = async () => {
    if (!lightbox) return;
    const liked = lightbox.likes?.includes(user.uid);
    const ref = doc(db, "posts", lightbox.id);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
    if (!liked && lightbox.authorId !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUserId: lightbox.authorId,
        fromUserId: user.uid,
        fromUserName: profile?.name || "Участник",
        type: "like",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleDeletePost = async () => {
    if (!lightbox) return;
    if (!window.confirm(t.profile.deletePostConfirm)) return;
    await deleteDoc(doc(db, "posts", lightbox.id));
    setLightbox(null);
  };

  const handleLightboxComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !lightbox) return;
    await addDoc(collection(db, "posts", lightbox.id, "comments"), {
      text: commentText,
      authorName: profile?.name || "Участник",
      authorPhoto: profile?.photoURL || "",
      createdAt: new Date().toISOString(),
    });
    if (lightbox.authorId !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUserId: lightbox.authorId,
        fromUserId: user.uid,
        fromUserName: profile?.name || "Участник",
        type: "postComment",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    setCommentText("");
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "short" });
  };

  const toggleSpecLang = (code) => {
    setSpecForm((f) => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter((l) => l !== code)
        : [...f.languages, code],
    }));
  };

  const toggleSpecDirection = (dir) => {
    setSpecForm((f) => ({
      ...f,
      directions: f.directions.includes(dir)
        ? f.directions.filter((d) => d !== dir)
        : [...f.directions, dir],
    }));
  };

  const handleSpecSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "specialists"), {
      userId: user.uid,
      name: profile?.name || "Участник",
      photoURL: profile?.photoURL || "",
      languages: specForm.languages,
      directions: specForm.directions,
      address: specForm.address,
      phone: specForm.phone,
      whatsapp: specForm.whatsapp,
      telegram: specForm.telegram,
      viber: specForm.viber,
      signal: specForm.signal,
      approved: false,
      x: null,
      y: null,
      createdAt: new Date().toISOString(),
    });
    setSpecSubmitted(true);
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
              {t.profile.saveCropBtn}
            </button>
            <button className="profile-delete-no" onClick={() => setCropSrc(null)}>
              {t.profile.cancelBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const liked = lightbox?.likes?.includes(user?.uid);

  return (
    <div className="profile-page">
      <div className="profile-badge-bg" style={{ backgroundImage: `url(${joinBg})` }}></div>
      <div className="profile-badge-overlay"></div>

      <div className="profile-scroll">
        <div className="profile-header">
          <div className="profile-avatar-wrap-edit">
            <div
              className="profile-avatar"
              onClick={() => profile?.photoURL && setAvatarViewOpen(true)}
              style={{ cursor: profile?.photoURL ? "pointer" : "default" }}
            >
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="avatar" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <button className="profile-avatar-edit-btn" onClick={handleAvatarClick}>✎</button>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <div className="profile-header-info">
            <h1 className="profile-name">{profile?.name}</h1>
            <div className="profile-city">{profile?.city}</div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-num">{myPosts.length}</span>
                <span className="profile-stat-label">{t.profile.publications}</span>
              </div>
              <Link to="/friends" className="profile-stat">
                <span className="profile-stat-num">{profile?.friends?.length || 0}</span>
                <span className="profile-stat-label">{t.friends.friendsCount}</span>
              </Link>
            </div>

            {!editing ? (
              <>
                <div className="profile-bio">
                  {profile?.bio && <div>{profile.bio}</div>}
                </div>
                <div className="profile-header-actions">
                  <button className="profile-btn-small" onClick={() => setEditing(true)}>
                    {t.profile.editBtn}
                  </button>
                  <button className="profile-logout-small" onClick={handleLogout}>
                    {t.profile.logoutBtn}
                  </button>
                  {user?.email === "pp.stela.ua@gmail.com" && (
                    <Link to="/admin" className="profile-admin-link">🏛️</Link>
                  )}
                </div>
              </>
            ) : (
              <div className="profile-edit-form">
                <div className="profile-spec-wrap">
                  <img
                    src={specialistEmblem}
                    alt={t.specialist.tooltip}
                    className="profile-spec-icon"
                    onMouseEnter={() => setSpecTooltip(true)}
                    onMouseLeave={() => setSpecTooltip(false)}
                    onClick={() => setSpecFormOpen(true)}
                  />
                  {specTooltip && (
                    <div className="profile-spec-tooltip">
                      {t.specialist.tooltip}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  name="city"
                  placeholder={t.profile.cityPlaceholder}
                  value={form.city}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="prado"
                  placeholder={t.profile.pradoPlaceholder}
                  value={form.prado}
                  onChange={handleChange}
                />
                <textarea
                  name="bio"
                  placeholder={t.profile.bioPlaceholder}
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                />
                <button className="profile-btn-small" onClick={handleSave}>
                  {t.profile.saveBtn}
                </button>
              </div>
            )}

            {!confirmDelete ? (
              <button className="profile-delete" onClick={() => setConfirmDelete(true)}>
                {t.profile.deleteAccountBtn}
              </button>
            ) : (
              <div className="profile-delete-confirm">
                <div className="profile-delete-text">
                  {t.profile.deleteConfirmText}
                </div>
                <div className="profile-delete-actions">
                  <button className="profile-delete-yes" onClick={handleDeleteAccount}>
                    {t.profile.deleteYesBtn}
                  </button>
                  <button className="profile-delete-no" onClick={() => setConfirmDelete(false)}>
                    {t.profile.cancelBtn}
                  </button>
                </div>
              </div>
            )}

            {deleteError && <div className="auth-error">{deleteError}</div>}
          </div>
        </div>

        <div className="profile-posts-section">
          <div className="profile-posts-label">{t.profile.myPublications} ({myPosts.length})</div>
          {myPosts.length === 0 ? (
            <div className="profile-posts-empty">{t.profile.noPostsYet}</div>
          ) : (
            <div className="profile-posts-grid">
              {myPosts.map((p) => (
                <button key={p.id} className="profile-posts-item" onClick={() => setLightbox(p)}>
                  <img src={p.image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {avatarViewOpen && profile?.photoURL && (
        <div className="avatar-view-overlay" onClick={() => setAvatarViewOpen(false)}>
          <img src={profile.photoURL} alt="" className="avatar-view-image" onClick={(e) => e.stopPropagation()} />
          <button className="avatar-view-close" onClick={() => setAvatarViewOpen(false)}>✕</button>
        </div>
      )}

      {specFormOpen && (
        <div className="spec-form-overlay" onClick={() => { setSpecFormOpen(false); setSpecSubmitted(false); }}>
          <div className="spec-form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="useful-card-close" onClick={() => { setSpecFormOpen(false); setSpecSubmitted(false); }}>✕</button>

            {specSubmitted ? (
              <div className="spec-form-success">
                {t.specialist.successMsg}
              </div>
            ) : (
              <form onSubmit={handleSpecSubmit}>
                <div className="spec-form-title">{t.specialist.formTitle}</div>

                <div className="spec-form-label">{t.specialist.languagesLabel}</div>
                <div className="spec-form-langs">
                  {["ru", "de", "en", "ua"].map((code) => (
                    <button
                      type="button"
                      key={code}
                      className={"spec-lang-btn" + (specForm.languages.includes(code) ? " active" : "")}
                      onClick={() => toggleSpecLang(code)}
                    >
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="spec-form-label">{t.specialist.directionsLabel}</div>
                <div className="spec-form-directions">
                  {DIRECTION_OPTIONS.map((dir) => (
                    <button
                      type="button"
                      key={dir}
                      className={"spec-lang-btn" + (specForm.directions.includes(dir) ? " active" : "")}
                      onClick={() => toggleSpecDirection(dir)}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder={t.specialist.addressPlaceholder}
                  value={specForm.address}
                  onChange={(e) => setSpecForm({ ...specForm, address: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder={t.specialist.phonePlaceholder}
                  value={specForm.phone}
                  onChange={(e) => setSpecForm({ ...specForm, phone: e.target.value })}
                  required
                />

                <div className="spec-form-label">{t.specialist.availableOnLabel}</div>
                <div className="spec-form-msgrs">
                  <label>
                    <input
                      type="checkbox"
                      checked={specForm.whatsapp}
                      onChange={(e) => setSpecForm({ ...specForm, whatsapp: e.target.checked })}
                    /> WhatsApp
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={specForm.telegram}
                      onChange={(e) => setSpecForm({ ...specForm, telegram: e.target.checked })}
                    /> Telegram
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={specForm.viber}
                      onChange={(e) => setSpecForm({ ...specForm, viber: e.target.checked })}
                    /> Viber
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={specForm.signal}
                      onChange={(e) => setSpecForm({ ...specForm, signal: e.target.checked })}
                    /> Signal
                  </label>
                </div>

                <button type="submit" className="profile-btn-small">{t.specialist.submitBtn}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div className="ig-lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="ig-lightbox-close" onClick={() => setLightbox(null)}>✕</button>

          {myPosts.findIndex((p) => p.id === lightbox.id) > 0 && (
            <button
              className="ig-lightbox-nav ig-lightbox-nav-left"
              onClick={(e) => {
                e.stopPropagation();
                const i = myPosts.findIndex((p) => p.id === lightbox.id);
                setLightbox(myPosts[i - 1]);
                setCommentText("");
              }}
            >
              ‹
            </button>
          )}

          {myPosts.findIndex((p) => p.id === lightbox.id) < myPosts.length - 1 && (
            <button
              className="ig-lightbox-nav ig-lightbox-nav-right"
              onClick={(e) => {
                e.stopPropagation();
                const i = myPosts.findIndex((p) => p.id === lightbox.id);
                setLightbox(myPosts[i + 1]);
                setCommentText("");
              }}
            >
              ›
            </button>
          )}

          <div className="ig-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="ig-lightbox-image">
              <img src={lightbox.image} alt="" />
            </div>
            <div className="ig-lightbox-side">
              <div className="ig-lightbox-header">
                <div className="ig-lightbox-avatar">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" />
                  ) : (
                    profile?.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <span>{profile?.name}</span>
                <button className="ig-delete-btn" onClick={handleDeletePost}>
                  {t.profile.deletePostBtn}
                </button>
              </div>

              <div className="ig-lightbox-comments">
                {lightbox.text && (
                  <div className="ig-comment">
                    <div className="ig-comment-avatar">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" />
                      ) : (
                        profile?.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <span className="ig-comment-author">{profile?.name}</span>{" "}
                      <span className="ig-comment-text">{lightbox.text}</span>
                    </div>
                  </div>
                )}
                {lightboxComments.map((c) => (
                  <div className="ig-comment" key={c.id}>
                    <div className="ig-comment-avatar">
                      {c.authorPhoto ? (
                        <img src={c.authorPhoto} alt="" />
                      ) : (
                        c.authorName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <span className="ig-comment-author">{c.authorName}</span>{" "}
                      <span className="ig-comment-text">{c.text}</span>
                      <div className="ig-comment-date">{formatDate(c.createdAt)}</div>
                    </div>
                  </div>
                ))}
                {lightboxComments.length === 0 && !lightbox.text && (
                  <div className="ig-comment-empty">{t.profile.noComments}</div>
                )}
              </div>

              <div className="ig-lightbox-actions">
                <button className="ig-like-btn" onClick={toggleLightboxLike}>
                  <HeartIcon filled={liked} size={26} />
                </button>
                <span className="ig-likes-count">{lightbox.likes?.length || 0} {t.profile.likesLabel}</span>
              </div>

              <form className="ig-comment-form" onSubmit={handleLightboxComment}>
                <input
                  type="text"
                  placeholder={t.profile.addComment}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" disabled={!commentText.trim()}>{t.profile.publishComment}</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;