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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      load();
    });
    return unsub;
  }, [navigate]);

  const load = async () => {
    const q = query(collection(db, "members"), where("visibleInCatalog", "!=", false));
    const snap = await getDocs(q);
    setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  return (
    <div className="members-page">
      <h1 className="members-title">{t.members.pageTitle}</h1>
      <div className="members-underline"></div>

      {loading && <div className="members-empty">{t.members.loading}</div>}

      {!loading && (
        <div className="members-grid">
          {members.map((m) => (
            <Link to={`/members/${m.id}`} key={m.id} className="member-card">
              <div className="member-avatar">
                {m.photoURL ? (
                  <img src={m.photoURL} alt={m.name} />
                ) : (
                  m.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="member-name">{m.name}</div>
              {m.showCity !== false && m.city && (
                <div className="member-city">{m.city}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Members;