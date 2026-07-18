import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, addDoc, getDocs, query, orderBy, where, limit, onSnapshot,
  updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Feed.css";

function Feed() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const [nextJourney, setNextJourney] = useState(null);

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
    const ref = doc(db, "posts", post.id);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatJourneyDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  };

  return (
    <div className="feed-page">
      <div className="feed-outer">
        <div className="feed-left">
          <div className="feed-header-sticky">
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
                  {post.image && <img src={post.image} alt="post" className="feed-post-image" />}

                  <div className="feed-post-actions">
                    <button
                      className={"feed-like-btn" + (liked ? " liked" : "")}
                      onClick={() => toggleLike(post)}
                    >
                      ♥ {post.likes?.length || 0}
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
      </div>
    </div>
  );
}

export default Feed;