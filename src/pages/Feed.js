import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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
    <div style={{ minHeight: "100vh", background: "#0B0D0C", padding: "100px 60px 100px 232px", color: "#F2EDE3", fontFamily: "'Inter', sans-serif" }}>
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

      <h1 style={{ fontFamily: "'Oswald', sans-serif" }}>Лента</h1>
      <p style={{ color: "#8a8578" }}>В разработке.</p>
    </div>
  );
}

export default Feed;