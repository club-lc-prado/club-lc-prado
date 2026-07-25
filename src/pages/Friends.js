import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Members.css";

function Friends() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setUser(u);
      const meSnap = await getDoc(doc(db, "members", u.uid));
      const friendIds = meSnap.exists() ? meSnap.data().friends || [] : [];

      const friendProfiles = await Promise.all(
        friendIds.map(async (fid) => {
          const s = await getDoc(doc(db, "members", fid));
          return s.exists() ? { id: fid, ...s.data() } : null;
        })
      );
      setFriends(friendProfiles.filter(Boolean));
      setLoading(false);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "friendRequests"), where("toUid", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs
          .filter((d) => d.data().status === "pending")
          .map(async (d) => {
            const data = d.data();
            const s = await getDoc(doc(db, "members", data.fromUid));
            return s.exists() ? { reqId: d.id, ...s.data(), fromUid: data.fromUid } : null;
          })
      );
      setPending(list.filter(Boolean));
    });
    return unsub;
  }, [user]);

  return (
    <div className="members-page">
      <h1 className="members-title">{t.friends.pageTitle}</h1>
      <div className="members-underline"></div>

      {pending.length > 0 && (
        <div className="friends-section">
          <div className="friends-section-label">{t.friends.pendingRequests}</div>
          <div className="members-grid">
            {pending.map((p) => (
              <Link to={`/members/${p.fromUid}`} key={p.reqId} className="member-card">
                <div className="member-avatar">
                  {p.photoURL ? <img src={p.photoURL} alt={p.name} /> : p.name?.[0]?.toUpperCase()}
                </div>
                <div className="member-name">{p.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="friends-section">
        <div className="friends-section-label">{t.friends.friendsLabel}</div>
        {loading && <div className="members-empty">{t.members.loading}</div>}
        {!loading && friends.length === 0 && (
          <div className="members-empty">{t.friends.noFriends}</div>
        )}
        {!loading && friends.length > 0 && (
          <div className="members-grid">
            {friends.map((f) => (
              <Link to={`/members/${f.id}`} key={f.id} className="member-card">
                <div className="member-avatar">
                  {f.photoURL ? <img src={f.photoURL} alt={f.name} /> : f.name?.[0]?.toUpperCase()}
                </div>
                <div className="member-name">{f.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;