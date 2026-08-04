import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, getDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, where, limit, onSnapshot,
  updateDoc, arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { Home, Send, Plus } from "lucide-react";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Feed.css";
import likeSound from "../like-sound.mp3";
import notifSound from "../notif-sound.mp3";
import cardFront from "../card-front.jpg";
import cardBack from "../card-back.jpg";

function Feed() {
  const { t, lang } = useLanguage();
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
  const [cardFlipped, setCardFlipped] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [burstFor, setBurstFor] = useState(null);
  const [notifConverging, setNotifConverging] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [stories, setStories] = useState([]);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const storyFileRef = useRef(null);

  const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

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
    if (!user) return;
    const ping = () => updateDoc(doc(db, "members", user.uid), { lastActive: new Date().toISOString() }).catch(() => {});
    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    const cq = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
    const unsubC = onSnapshot(cq, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const aUnread = a.lastMessageBy && a.lastMessageBy !== user.uid && !a.readBy?.includes(user.uid) ? 1 : 0;
        const bUnread = b.lastMessageBy && b.lastMessageBy !== user.uid && !b.readBy?.includes(user.uid) ? 1 : 0;
        if (aUnread !== bUnread) return bUnread - aUnread;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });
      setConversations(list.slice(0, 5));
    });
    return unsubC;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const nq = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid)
    );
    const unsub = onSnapshot(nq, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(items.slice(0, 30));
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
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.name || "Участник",
        authorPhoto: profile?.photoURL || "",
        text: text.trim(),
        image: imagePreview || "",
        likes: [],
        createdAt: new Date().toISOString(),
      });
      setText("");
      setImagePreview(null);
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

  const getYouTubeId = (text) => {
    if (!text) return null;
    const match = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatJourneyDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { day: "2-digit", month: "long" });
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
    if (n.type === "like") return `${n.fromUserName} ${t.feed.likedYourPost}`;
    if (n.type === "comment") return `${n.fromUserName} ${t.feed.commentedTopic} "${n.journeyTitle}"`;
    if (n.type === "postComment") return `${n.fromUserName} ${t.feed.commentedYourPost}`;
    if (n.type === "rsvp") return `${n.fromUserName} ${t.feed.joinedCall} "${n.journeyTitle}"`;
    if (n.type === "message") return `${n.fromUserName}: ${t.messages.writeMsg.replace("...", "")}`;
    if (n.type === "friendRequest") return `${n.fromUserName} ${t.friends.requestFrom}`;
    if (n.type === "friendAccepted") return `${n.fromUserName} ${t.friends.accepted}`;
    return n.fromUserName;
  };

  const linkFor = (n) => {
    if (n.type === "message") return `/messages/${n.fromUserId}`;
    if (n.type === "friendAccepted") return `/members/${n.fromUserId}`;
    if (n.journeyId) return `/journeys/${n.journeyId}`;
    return "/profile";
  };

  const loadStories = async () => {
    const snap = await getDocs(collection(db, "stories"));
    const now = Date.now();
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => now - new Date(s.createdAt).getTime() < 24 * 60 * 60 * 1000);

    const groups = {};
    active.forEach((s) => {
      if (!groups[s.authorId]) groups[s.authorId] = [];
      groups[s.authorId].push(s);
    });
    Object.values(groups).forEach((arr) => arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));

    const groupList = Object.entries(groups).map(([authorId, items]) => ({
      authorId,
      authorName: items[0].authorName,
      authorPhoto: items[0].authorPhoto,
      items,
      hasUnviewed: items.some((i) => !i.viewedBy?.includes(user?.uid)),
    }));
    groupList.sort((a, b) => (a.hasUnviewed === b.hasUnviewed ? 0 : a.hasUnviewed ? -1 : 1));
    setStories(groupList);
  };

  const handleStoryFile = (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

        await addDoc(collection(db, "stories"), {
          authorId: user.uid,
          authorName: profile?.name || "Участник",
          authorPhoto: profile?.photoURL || "",
          image: dataUrl,
          createdAt: new Date().toISOString(),
          viewedBy: [],
        });
        loadStories();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openStoryGroup = (group, startIndex = 0) => {
    setViewingGroup(group);
    setStoryIndex(startIndex);
  };

  const markStoryViewed = async (story) => {
    if (!user || story.viewedBy?.includes(user.uid)) return;
    await updateDoc(doc(db, "stories", story.id), { viewedBy: arrayUnion(user.uid) });
  };

  useEffect(() => {
    if (!viewingGroup) return;
    const current = viewingGroup.items[storyIndex];
    if (!current) {
      setViewingGroup(null);
      return;
    }
    markStoryViewed(current);

    const timer = setTimeout(() => {
      if (storyIndex + 1 < viewingGroup.items.length) {
        setStoryIndex((i) => i + 1);
      } else {
        setViewingGroup(null);
        loadStories();
      }
    }, 5000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingGroup, storyIndex]);

  const acceptFriendFromNotif = async (n) => {
    const rId = [user.uid, n.fromUserId].sort().join("_");
    await updateDoc(doc(db, "friendRequests", rId), { status: "accepted" });
    await updateDoc(doc(db, "members", user.uid), { friends: arrayUnion(n.fromUserId) });
    await updateDoc(doc(db, "members", n.fromUserId), { friends: arrayUnion(user.uid) });
    await addDoc(collection(db, "notifications"), {
      toUserId: n.fromUserId,
      fromUserId: user.uid,
      fromUserName: profile?.name || "Участник",
      type: "friendAccepted",
      read: false,
      createdAt: new Date().toISOString(),
    });
    await deleteDoc(doc(db, "notifications", n.id));
  };

  const declineFriendFromNotif = async (n) => {
    const rId = [user.uid, n.fromUserId].sort().join("_");
    await deleteDoc(doc(db, "friendRequests", rId));
    await deleteDoc(doc(db, "notifications", n.id));
  };

  return (
    <div className="feed-page">
      <div className="feed-outer">
        <div className="feed-left">
          <div className="feed-header-sticky">
            <div className="feed-account-row" ref={menuRef}>
              <div className="feed-avatar-preview-wrap">
                <Link to="/profile" className="feed-account">
                  <div className="feed-avatar-wrap-online">
                    <div className="feed-avatar">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="avatar" />
                      ) : (
                        profile?.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    {profile?.lastActive && (Date.now() - new Date(profile.lastActive).getTime()) < 120000 && (
                      <span className="online-dot"></span>
                    )}
                  </div>
                  <span className="feed-account-name">{profile?.name || t.feed.guest}</span>
                </Link>
              </div>

              {user && (
                <div className="feed-header-icons">
                  <Link to="/" className="feed-home-btn" aria-label="Home">
                    <Home size={18} />
                  </Link>

                  <Link to="/messages" className="feed-home-btn">
                    <Send size={18} />
                    {conversations.filter((c) => c.lastMessageBy && c.lastMessageBy !== user.uid && !c.readBy?.includes(user.uid)).length > 0 && (
                      <span className="feed-gear-badge">
                        {conversations.filter((c) => c.lastMessageBy && c.lastMessageBy !== user.uid && !c.readBy?.includes(user.uid)).length}
                      </span>
                    )}
                  </Link>

                  <div className="feed-notif-wrap">
                    <button className="feed-notif-btn" ref={notifBtnRef} onClick={openNotifications}>
                      <HeartIcon filled={unreadCount > 0} size={26} />
                      {unreadCount > 0 && <span className="feed-gear-badge">{unreadCount}</span>}
                    </button>

                    {notifOpen && (
                      <div className="notif-dropdown">
                        {notifications.length === 0 && (
                          <div className="notif-dropdown-empty">{t.feed.notifEmpty}</div>
                        )}
                        {notifications.map((n) => (
                          <div key={n.id} className="notif-dropdown-item" style={{ cursor: "default" }}>
                            {n.type === "friendRequest" ? (
                              <>
                                <div className="notif-dropdown-text">{textFor(n)}</div>
                                <div className="notif-friend-actions">
                                  <button
                                    type="button"
                                    className="notif-friend-accept"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acceptFriendFromNotif(n);
                                    }}
                                  >
                                    {t.friends.acceptBtn}
                                  </button>
                                  <button
                                    type="button"
                                    className="notif-friend-decline"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      declineFriendFromNotif(n);
                                    }}
                                  >
                                    {t.friends.declineBtn}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <Link
                                to={linkFor(n)}
                                onClick={() => setNotifOpen(false)}
                                style={{ display: "block", color: "inherit", textDecoration: "none" }}
                              >
                                <div className="notif-dropdown-text">{textFor(n)}</div>
                                <div className="notif-dropdown-date">{formatDate(n.createdAt)}</div>
                              </Link>
                            )}
                          </div>
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
                        <button onClick={() => { setQrOpen(true); setMenuOpen(false); }}>{t.feed.qrCode}</button>
                        <Link to="/profile" onClick={() => setMenuOpen(false)}>{t.feed.editProfile}</Link>
                        <Link to="/settings" onClick={() => setMenuOpen(false)}>{t.feed.settingsPrivacy}</Link>
                        <button onClick={handleLogout} className="feed-gear-logout">{t.feed.logout}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <h1 className="feed-title">{t.feed.title}</h1>
            <div className="feed-underline"></div>
          </div>

          {user && (
            <div className="stories-bar">
              {(() => {
                const myGroup = stories.find((g) => g.authorId === user.uid);
                return (
                  <div
                    className="story-item"
                    onClick={() => myGroup ? openStoryGroup(myGroup, 0) : storyFileRef.current?.click()}
                  >
                    <div className={"story-avatar-wrap story-add" + (myGroup ? (myGroup.hasUnviewed ? " unviewed" : " viewed") : "")}>
                      <div className="feed-avatar">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt="avatar" />
                        ) : (
                          profile?.name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <span
                        className="story-add-icon"
                        onClick={(e) => { e.stopPropagation(); storyFileRef.current?.click(); }}
                      >
                        <Plus size={12} />
                      </span>
                    </div>
                    <span className="story-name">{myGroup ? "Моя история" : "Добавить"}</span>
                  </div>
                );
              })()}
              <input
                type="file"
                accept="image/*"
                ref={storyFileRef}
                onChange={handleStoryFile}
                style={{ display: "none" }}
              />

              {stories.filter((g) => g.authorId !== user.uid).map((g) => (
                <div key={g.authorId} className="story-item" onClick={() => openStoryGroup(g, 0)}>
                  <div className={"story-avatar-wrap" + (g.hasUnviewed ? " unviewed" : " viewed")}>
                    <div className="feed-avatar">
                      {g.authorPhoto ? (
                        <img src={g.authorPhoto} alt={g.authorName} />
                      ) : (
                        g.authorName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  </div>
                  <span className="story-name">{g.authorName}</span>
                </div>
              ))}
            </div>
          )}

          {user && (
            <div className="feed-composer">
              <textarea
                placeholder={t.feed.composerPlaceholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
              {imagePreview && (
                <div className="feed-composer-preview-wrap">
                  <img src={imagePreview} alt="preview" className="feed-composer-preview" />
                  <button
                    type="button"
                    className="feed-composer-preview-clear"
                    onClick={() => setImagePreview(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="feed-composer-actions">
                <button
                  className="feed-composer-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? t.feed.replacePhoto : t.feed.addPhoto}
                </button>
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
                  {posting ? t.feed.publishing : t.feed.publishBtn}
                </button>
              </div>
            </div>
          )}

          <div className="feed-posts">
            {posts.length === 0 && (
              <div className="feed-empty">{t.feed.empty}</div>
            )}

            {posts.map((post) => {
              const liked = post.likes?.includes(user?.uid);
              return (
                <div key={post.id} className="feed-post">
                  <div className="feed-post-header">
                    {(() => {
                      const authorGroup = stories.find((g) => g.authorId === post.authorId);
                      const ringClass = authorGroup
                        ? (authorGroup.hasUnviewed ? " story-ring unviewed" : " story-ring viewed")
                        : "";
                      return (
                        <div
                          className={"feed-post-avatar-wrap" + ringClass}
                          onClick={() => authorGroup ? openStoryGroup(authorGroup, 0) : navigate(`/members/${post.authorId}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="feed-avatar">
                            {post.authorPhoto ? (
                              <img src={post.authorPhoto} alt={post.authorName} />
                            ) : (
                              post.authorName?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <span className="feed-post-author">{post.authorName}</span>
                    <span className="feed-post-date">{formatDate(post.createdAt)}</span>
                  </div>

                  {post.text && <p className="feed-post-text">{post.text}</p>}
                  {getYouTubeId(post.text) && (
                    <div className="feed-post-video-wrap">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(post.text)}`}
                        title="YouTube video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
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
            <div className="feed-side-label">{t.feed.membersInClub}</div>
            <div className="feed-side-value">{memberCount ?? "—"}</div>
          </Link>

          <Link to={nextJourney ? `/journeys/${nextJourney.id}` : "/journeys"} className="feed-side-card">
            <div className="feed-side-label">{t.feed.nearestCall}</div>
            {nextJourney ? (
              <>
                <div className="feed-side-value small">{nextJourney.title}</div>
                <div className="feed-side-sub">{formatJourneyDate(nextJourney.date)}</div>
              </>
            ) : (
              <div className="feed-side-value small">{t.feed.notPlanned}</div>
            )}
          </Link>
        </div>
      </div>

      {viewingGroup && viewingGroup.items[storyIndex] && (
        <div className="story-viewer-overlay" onClick={() => { setViewingGroup(null); loadStories(); }}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="story-progress-row">
              {viewingGroup.items.map((_, i) => (
                <div key={i} className="story-progress-track">
                  <div
                    className={
                      "story-progress-fill" +
                      (i < storyIndex ? " full" : i === storyIndex ? " active" : "")
                    }
                  ></div>
                </div>
              ))}
            </div>
            <div className="story-viewer-header">
              <div className="feed-avatar" style={{ width: 32, height: 32 }}>
                {viewingGroup.authorPhoto ? (
                  <img src={viewingGroup.authorPhoto} alt="" />
                ) : (
                  viewingGroup.authorName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <span>{viewingGroup.authorName}</span>
              {viewingGroup.authorId === user?.uid && (
                <button
                  className="story-viewer-delete"
                  onClick={async () => {
                    if (!window.confirm("Удалить эту историю?")) return;
                    await deleteDoc(doc(db, "stories", viewingGroup.items[storyIndex].id));
                    setViewingGroup(null);
                    loadStories();
                  }}
                >
                  Удалить
                </button>
              )}
              <button className="story-viewer-close" onClick={() => { setViewingGroup(null); loadStories(); }}>✕</button>
            </div>
            <img src={viewingGroup.items[storyIndex].image} alt="" className="story-viewer-image" />
            <div className="story-viewer-nav">
              <div
                className="story-viewer-nav-prev"
                onClick={() => storyIndex > 0 && setStoryIndex((i) => i - 1)}
              ></div>
              <div
                className="story-viewer-nav-next"
                onClick={() =>
                  storyIndex + 1 < viewingGroup.items.length ? setStoryIndex((i) => i + 1) : setViewingGroup(null)
                }
              ></div>
            </div>
          </div>
        </div>
      )}

      {qrOpen && user && (
        <div className="qr-modal-overlay" onClick={() => { setQrOpen(false); setCardFlipped(false); }}>
          <div className="qr-modal card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flip-card" onClick={() => setCardFlipped(!cardFlipped)}>
              <div className={"flip-card-inner" + (cardFlipped ? " flipped" : "")}>
                <div className="flip-card-front">
                  <img src={cardFront} alt="Визитка клуба" />
                </div>
                <div className="flip-card-back">
                  <img src={cardBack} alt="QR-код" />
                </div>
              </div>
            </div>
            <div className="qr-modal-text">Нажми на визитку, чтобы перевернуть</div>
            <button className="qr-modal-close" onClick={() => { setQrOpen(false); setCardFlipped(false); }}>{t.feed.close}</button>
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