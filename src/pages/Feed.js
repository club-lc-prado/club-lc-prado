import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, getDoc, collection, addDoc, getDocs, query, orderBy, where, limit, onSnapshot,
  updateDoc, arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Feed.css";
import likeSound from "../like-sound.mp3";
import notifSound from "../notif-sound.mp3";

function Feed() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const notifBtnRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const [nextJourney, setNextJourney] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [burstFor, setBurstFor] = useState(null);
  const [notifConverging, setNotifConverging] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [journeysList, setJourneysList] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "members", u.uid));
        if (snap.exists()) setProfile(snap.data());
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadJourneys = async () => {
      const snap = await getDocs(collection(db, "journeys"));
      setJourneysList(snap.docs.map((d) => ({ id: d.id, title: d.data().title })));
    };
    loadJourneys();
  }, []);

  useEffect(() => {
    const loadSide = async () => {
      const membersSnap = await getDocs(collection(db, "members"));
      setMemberCount(membersSnap.size);

      const today = new Date().toISOString().split("T")[0];
      const jq = query(
        collection(db, "journeys"),
        where("date", ">=", today),
        orderBy("date", "asc"),
        limit(1)
      );
      const jSnap = await getDocs(jq);
      if (!jSnap.empty) {
        const d = jSnap.docs[0];
        setNextJourney({ id: d.id, ...d.data() });
      }
    };
    loadSide();
  }, []);

  useEffect(() => {
    if (!user) return;
    const nq = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(nq, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(items);
      setUnreadCount(items.filter((i) => !i.read).length);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target) &&
        !e.target.closest(".notif-dropdown")
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImagePreview(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!text.trim() && !imagePreview) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setPosting(true);
    try {
      const chosenJourney = journeysList.find((j) => j.id === selectedJourney);
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.name || "Участник",
        authorPhoto: profile?.photoURL || "",
        text: text.trim(),
        image: imagePreview || "",
        likes: [],
        journeyId: chosenJourney?.id || null,
        journeyTitle: chosenJourney?.title || null,
        createdAt: new Date().toISOString(),
      });
      setText("");
      setImagePreview(null);
      setSelectedJourney("");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const liked = post.likes?.includes(user.uid);
    if (!liked) {
      new Audio(likeSound).play().catch(() => {});
    }
    const ref = doc(db, "posts", post.id);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });

    if (!liked && post.authorId !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUserId: post.authorId,
        fromUserId: user.uid,
        fromUserName: profile?.name || "Участник",
        type: "like",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handlePhotoTap = (post) => {
    const liked = post.likes?.includes(user?.uid);
    if (!liked) {
      toggleLike(post);
      const particles = [...Array(60)].map((_, i) => ({
        id: i,
        angle: Math.random() * 360,
        dist: 60 + Math.random() * 90,
        size: 10 + Math.random() * 16,
        delay: Math.random() * 0.25,
        duration: 0.6 + Math.random() * 0.5,
      }));
      setBurstFor({ postId: post.id, particles });
      setTimeout(() => setBurstFor(null), 1200);
    }
  };

  const HeartIcon = ({ filled, size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b5e" />
          <stop offset="100%" stopColor="#c0392b" />
        </linearGradient>
      </defs>
      <path
        d="M12,21.35 L10.55,20.03 C5.4,15.36 2,12.28 2,8.5 C2,5.42 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.09 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.42 22,8.5 C22,12.28 18.6,15.36 13.45,20.04 L12,21.35 Z"
        fill={filled ? "url(#heartGrad)" : "none"}
        stroke={filled ? "#c0392b" : "#8a8578"}
        strokeWidth="1.5"
      />
    </svg>
  );

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatJourneyDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const openNotifications = () => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    new Audio(notifSound).play().catch(() => {});
    const rect = notifBtnRef.current.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    const particles = [...Array(100)].map((_, i) => ({
      id: i,
      startX: Math.random() * window.innerWidth,
      startY: Math.random() * window.innerHeight,
      delay: Math.random() * 0.3,
      size: 8 + Math.random() * 14,
    }));

    setNotifConverging({ targetX, targetY, particles });
    setTimeout(() => {
      setNotifConverging(null);
      setNotifOpen(true);
      markAllRead();
    }, 800);
  };

  const textFor = (n) => {
    if (n.type === "like") return `${n.fromUserName} оценил(а) твой пост`;
    if (n.type === "comment") return `${n.fromUserName} прокомментировал(а) "${n.journeyTitle}"`;
    if (n.type === "rsvp") return `${n.fromUserName} присоединился(лась) к "${n.journeyTitle}"`;
    return n.fromUserName;
  };

  const linkFor = (n) => {
    if (n.journeyId) return `/journeys/${n.journeyId}`;
    return "/feed";
  };

  return (
    <div className="feed-page">
      <div className="feed-outer">
        <div className="feed-left">
          <div className="feed-header-sticky">
            <div className="feed-account-row" ref={menuRef}>
              <Link to="/profile" className="feed-account">
                <div className="feed-avatar">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="avatar" />
                  ) : (
                    profile?.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <span className="feed-account-name">{profile?.name || "Гость"}</span>
              </Link>

              {user && (
                <div className="feed-header-icons">
                  <div className="feed-notif-wrap">
                    <button className="feed-notif-btn" ref={notifBtnRef} onClick={openNotifications}>
                      <HeartIcon filled={unreadCount > 0} size={26} />
                      {unreadCount > 0 && <span className="feed-gear-badge">{unreadCount}</span>}
                    </button>

                    {notifOpen && (
                      <div className="notif-dropdown">
                        {notifications.length === 0 && (
                          <div className="notif-dropdown-empty">Пока пусто</div>
                        )}
                        {notifications.map((n) => (
                          <Link
                            key={n.id}
                            to={linkFor(n)}
                            className="notif-dropdown-item"
                            onClick={() => setNotifOpen(false)}
                          >
                            <div className="notif-dropdown-text">{textFor(n)}</div>
                            <div className="notif-dropdown-date">{formatDate(n.createdAt)}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="feed-gear-wrap">
                    <button className="feed-gear-btn" onClick={() => setMenuOpen(!menuOpen)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </button>
                    {menuOpen && (
                      <div className="feed-gear-menu">
                        <button onClick={() => { setQrOpen(true); setMenuOpen(false); }}>QR-код</button>
                        <Link to="/profile" onClick={() => setMenuOpen(false)}>Редактировать профиль</Link>
                        <Link to="/settings" onClick={() => setMenuOpen(false)}>Настройки и конфиденциальность</Link>
                        <button onClick={() => { alert("Дата регистрации: " + (profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ru-RU") : "неизвестно")); setMenuOpen(false); }}>Входы в аккаунт</button>
                        <button onClick={handleLogout} className="feed-gear-logout">Выйти</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <h1 className="feed-title">Лента</h1>
            <div className="feed-underline"></div>
          </div>

          {user && (
            <div className="feed-composer">
              <textarea
                placeholder="Поделись чем-то с клубом..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="feed-composer-preview" />
              )}
              <div className="feed-composer-actions">
                <button
                  className="feed-composer-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? "Заменить фото" : "+ Фото"}
                </button>

                <select
                  className="feed-composer-journey-select"
                  value={selectedJourney}
                  onChange={(e) => setSelectedJourney(e.target.value)}
                >
                  <option value="">Без привязки к поездке</option>
                  {journeysList.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                <button
                  className="feed-composer-submit"
                  onClick={handlePost}
                  disabled={posting || (!text.trim() && !imagePreview)}
                >
                  {posting ? "Публикуем..." : "Опубликовать"}
                </button>
              </div>
            </div>
          )}

          <div className="feed-posts">
            {posts.length === 0 && (
              <div className="feed-empty">Пока пусто. Стань первым, кто поделится историей.</div>
            )}

            {posts.map((post) => {
              const liked = post.likes?.includes(user?.uid);
              return (
                <div key={post.id} className="feed-post">
                  <div className="feed-post-header">
                    <div className="feed-avatar">
                      {post.authorPhoto ? (
                        <img src={post.authorPhoto} alt={post.authorName} />
                      ) : (
                        post.authorName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <span className="feed-post-author">{post.authorName}</span>
                    <span className="feed-post-date">{formatDate(post.createdAt)}</span>
                  </div>

                  {post.text && <p className="feed-post-text">{post.text}</p>}
                  {post.image && (
                    <div className="feed-post-image-wrap" onClick={() => handlePhotoTap(post)}>
                      <img src={post.image} alt="post" className="feed-post-image" />
                      {burstFor?.postId === post.id && (
                        <div className="heart-burst">
                          <div className="heart-burst-center"><HeartIcon filled={true} size={90} /></div>
                          {burstFor.particles.map((p) => (
                            <span
                              key={p.id}
                              className="heart-particle"
                              style={{
                                "--angle": `${p.angle}deg`,
                                "--dist": `${p.dist}px`,
                                animationDelay: `${0.45 + p.delay}s`,
                                animationDuration: `${p.duration}s`,
                              }}
                            >
                              <HeartIcon filled={true} size={p.size} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="feed-post-actions">
                    <button
                      className={"feed-like-btn" + (liked ? " liked" : "")}
                      onClick={() => toggleLike(post)}
                    >
                      <HeartIcon filled={liked} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="feed-side">
          <Link to="/members" className="feed-side-card">
            <div className="feed-side-label">Участников в клубе</div>
            <div className="feed-side-value">{memberCount ?? "—"}</div>
          </Link>

          <Link to={nextJourney ? `/journeys/${nextJourney.id}` : "/journeys"} className="feed-side-card">
            <div className="feed-side-label">Ближайший клич</div>
            {nextJourney ? (
              <>
                <div className="feed-side-value small">{nextJourney.title}</div>
                <div className="feed-side-sub">{formatJourneyDate(nextJourney.date)}</div>
              </>
            ) : (
              <div className="feed-side-value small">Пока не запланировано</div>
            )}
          </Link>

          </div>

        <Link to="/album" className="feed-book">
          <div className="feed-book-cover">
            <div className="feed-book-spine"></div>
            <div className="feed-book-title">
              <span>МОЙ</span>
              <span>АЛЬБОМ</span>
            </div>
          </div>
        </Link>
      </div>

      {qrOpen && user && (
        <div className="qr-modal-overlay" onClick={() => setQrOpen(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(window.location.origin + "/members/" + user.uid)}`}
              alt="QR код профиля"
            />
            <div className="qr-modal-text">Отсканируй, чтобы открыть мой профиль в клубе</div>
            <button className="qr-modal-close" onClick={() => setQrOpen(false)}>Закрыть</button>
          </div>
        </div>
      )}

      {notifConverging && (
        <div className="notif-converge-overlay">
          {notifConverging.particles.map((p) => (
            <span
              key={p.id}
              className="notif-converge-particle"
              style={{
                left: p.startX,
                top: p.startY,
                "--tx": `${notifConverging.targetX - p.startX}px`,
                "--ty": `${notifConverging.targetY - p.startY}px`,
                animationDelay: `${p.delay}s`,
              }}
            >
              <HeartIcon filled={true} size={p.size} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Feed;