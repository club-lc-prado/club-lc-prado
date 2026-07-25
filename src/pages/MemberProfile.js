import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Members.css";

function getReqId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function MemberProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState("none");
  const [reqDocId, setReqDocId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setCurrentUid(u.uid);
      const meSnap = await getDoc(doc(db, "members", u.uid));
      if (meSnap.exists()) setCurrentProfile(meSnap.data());
      load(u.uid);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const load = async (myUid) => {
    const snap = await getDoc(doc(db, "members", id));
    if (snap.exists()) setMember(snap.data());
    setLoading(false);

    if (myUid && myUid !== id) {
      const rId = getReqId(myUid, id);
      const reqSnap = await getDoc(doc(db, "friendRequests", rId));
      if (reqSnap.exists()) {
        const data = reqSnap.data();
        setReqDocId(rId);
        if (data.status === "accepted") setFriendStatus("friends");
        else if (data.fromUid === myUid) setFriendStatus("sent");
        else setFriendStatus("received");
      }
    }
  };

  const sendRequest = async () => {
    const rId = getReqId(currentUid, id);
    await doc(db, "friendRequests", rId);
    const { setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "friendRequests", rId), {
      fromUid: currentUid,
      toUid: id,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    await addDoc(collection(db, "notifications"), {
      toUserId: id,
      fromUserId: currentUid,
      fromUserName: currentProfile?.name || "Участник",
      type: "friendRequest",
      read: false,
      createdAt: new Date().toISOString(),
    });
    setFriendStatus("sent");
    setReqDocId(rId);
  };

  const acceptRequest = async () => {
    await updateDoc(doc(db, "friendRequests", reqDocId), { status: "accepted" });
    await updateDoc(doc(db, "members", currentUid), { friends: arrayUnion(id) });
    await updateDoc(doc(db, "members", id), { friends: arrayUnion(currentUid) });
    await addDoc(collection(db, "notifications"), {
      toUserId: id,
      fromUserId: currentUid,
      fromUserName: currentProfile?.name || "Участник",
      type: "friendAccepted",
      read: false,
      createdAt: new Date().toISOString(),
    });
    setFriendStatus("friends");
  };

  const declineRequest = async () => {
    await deleteDoc(doc(db, "friendRequests", reqDocId));
    setFriendStatus("none");
    setReqDocId(null);
  };

  if (loading) return <div className="members-page"></div>;
  if (!member) return <div className="members-page">{t.members.notFound}</div>;

  return (
    <div className="members-page">
      <Link to="/members" className="member-back">{t.members.backToAll}</Link>

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

        {currentUid && currentUid !== id && (
          <div className="member-actions">
            <Link to={`/messages/${id}`} className="member-message-btn">
              {t.messages.sendMessageBtn}
            </Link>

            {friendStatus === "none" && (
              <button className="member-friend-btn" onClick={sendRequest}>
                {t.friends.addBtn}
              </button>
            )}
            {friendStatus === "sent" && (
              <button className="member-friend-btn sent" disabled>
                {t.friends.requestSent}
              </button>
            )}
            {friendStatus === "received" && (
              <div className="member-friend-actions">
                <button className="member-friend-btn" onClick={acceptRequest}>
                  {t.friends.acceptBtn}
                </button>
                <button className="member-friend-btn decline" onClick={declineRequest}>
                  {t.friends.declineBtn}
                </button>
              </div>
            )}
            {friendStatus === "friends" && (
              <button className="member-friend-btn friends" disabled>
                ✓ {t.friends.friendsLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberProfile;