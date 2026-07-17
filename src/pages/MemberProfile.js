import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Members.css";

function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
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
    const snap = await getDoc(doc(db, "members", id));
    if (snap.exists()) setMember(snap.data());
    setLoading(false);
  };

  if (loading) return <div className="members-page"></div>;
  if (!member) return <div className="members-page">Участник не найден.</div>;

  return (
    <div className="members-page">
      <Link to="/members" className="member-back">← Все участники</Link>

      <div className="member-profile-card">
        <div className="member-avatar large">
          {member.photoURL ? (
            <img src={member.photoURL} alt={member.name} />
          ) : (
            member.name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <h1 className="member-profile-name">{member.name}</h1>
        {member.showCity !== false && member.city && (
          <div className="member-city">{member.city}</div>
        )}
        {member.bio && <p className="member-profile-bio">{member.bio}</p>}
      </div>
    </div>
  );
}

export default MemberProfile;