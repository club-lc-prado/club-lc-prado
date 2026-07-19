import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import HTMLFlipBook from "react-pageflip";
import "./Album.css";

function Album() {
  const { uid: paramUid } = useParams();
  const navigate = useNavigate();
  const bookRef = useRef(null);

  const [user, setUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

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
    const targetUid = paramUid || user.uid;

    const load = async () => {
      const ownerSnap = await getDoc(doc(db, "members", targetUid));
      if (!ownerSnap.exists()) {
        setLoading(false);
        return;
      }
      const owner = ownerSnap.data();
      setOwnerProfile(owner);

      const isOwner = targetUid === user.uid;
      if (!isOwner && owner.albumPublic !== true) {
        setDenied(true);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "posts"),
        where("authorId", "==", targetUid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.image);
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setPosts(list);
      setLoading(false);
    };
    load();
  }, [user, paramUid]);

  if (loading) return <div className="album-page"></div>;

  if (denied) {
    return (
      <div className="album-page">
        <div className="album-denied">Этот альбом приватный.</div>
      </div>
    );
  }

  return (
    <div className="album-page">
      <Link to="/feed" className="album-back">← Назад в ленту</Link>

      <h1 className="album-title">Альбом {ownerProfile?.name}</h1>
      <div className="album-underline"></div>

      {posts.length === 0 ? (
        <div className="album-empty">Пока нет фото с постов.</div>
      ) : (
        <div className="album-book-wrap">
          <HTMLFlipBook
            ref={bookRef}
            width={300}
            height={420}
            size="stretch"
            minWidth={250}
            maxWidth={420}
            minHeight={350}
            maxHeight={560}
            showCover={false}
            className="album-flipbook"
          >
            {posts.map((p) => (
              <div className="album-page-item" key={p.id}>
                <img src={p.image} alt="" />
                {p.text && <div className="album-page-caption">{p.text}</div>}
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      )}
    </div>
  );
}

export default Album;