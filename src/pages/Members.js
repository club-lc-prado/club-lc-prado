import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Members.css";

function Members() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState(null);
  const [storiesByAuthor, setStoriesByAuthor] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setCurrentUid(u.uid);
      load();
      loadStories();
    });
    return unsub;
  }, [navigate]);

  const load = async () => {
    const q = query(collection(db, "members"), where("visibleInCatalog", "!=", false));
    const snap = await getDocs(q);
    setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const loadStories = async () => {
    const snap = await getDocs(collection(db, "stories"));
    const now = Date.now();
    const map = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (now - new Date(data.createdAt).getTime() < 24 * 60 * 60 * 1000) {
        map[d.id] = data;
      }
    });
    setStoriesByAuthor(map);
  };

  return (
    <div className="members-page">
      <h1 className="members-title">{t.members.pageTitle}</h1>
      <div className="members-underline"></div>

      {loading && <div className="members-empty">{t.members.loading}</div>}

      {!loading && (
        <div className="members-grid">
          {members.map((m) => {
            const story = storiesByAuthor[m.id];
            const ringClass = story
              ? (story.viewedBy?.includes(currentUid) ? " story-ring viewed" : " story-ring unviewed")
              : "";
            return (
              <Link to={`/members/${m.id}`} key={m.id} className="member-card">
                <div className={"member-avatar-wrap" + ringClass}>
                  <div className="member-avatar">
                    {m.photoURL ? (
                      <img src={m.photoURL} alt={m.name} />
                    ) : (
                      m.name?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  {m.lastActive && (Date.now() - new Date(m.lastActive).getTime()) < 120000 && (
                    <span className="online-dot"></span>
                  )}
                </div>
                <div className="member-name">{m.name}</div>
                {m.showCity !== false && m.city && (
                  <div className="member-city">{m.city}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Members;