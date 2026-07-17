import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./TechInfo.css";

function Feed() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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

  return (
    <div className="static-page" style={{ background: "#0B0D0C" }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "#F2EDE3",
            marginBottom: "40px",
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#D4831C",
            color: "#0B0D0C",
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              profile?.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>
            {profile?.name || "Гость"}
          </span>
        </Link>

        <h1 className="static-page-title" style={{ position: "static" }}>Лента</h1>
        <p style={{ color: "#8a8578", fontFamily: "'Inter', sans-serif", marginTop: "16px" }}>
          В разработке.
        </p>
      </div>
    </div>
  );
}

export default Feed;