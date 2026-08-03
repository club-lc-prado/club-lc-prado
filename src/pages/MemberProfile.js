import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, arrayUnion, onSnapshot,
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
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [memberStory, setMemberStory] = useState(null);
  const [viewingStory, setViewingStory] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      setCurrentUid(u.uid);
      const meSnap = await getDoc(doc(db, "members", u.uid));
      if (meSnap.exists()) setCurrentProfile(meSnap.data());
      setBlockedByMe((meSnap.data()?.blockedUsers || []).includes(id));
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "members", id));
      if (snap.exists()) setMember(snap.data());
      setLoading(false);

      const storySnap = await getDoc(doc(db, "stories", id));
      if (storySnap.exists()) {
        const data = storySnap.data();
        if (Date.now() - new Date(data.createdAt).getTime() < 24 * 60 * 60 * 1000) {
          setMemberStory({ id, ...data });
        }
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!currentUid || currentUid === id) return;
    const rId = getReqId(currentUid, id);
    setReqDocId(rId);
    const unsub = onSnapshot(doc(db, "friendRequests", rId), (snap) => {
      if (!snap.exists()) {
        setFriendStatus("none");
        return;
      }
      const data = snap.data();
      if (data.status === "accepted") setFriendStatus("friends");
      else if (data.fromUid === currentUid) setFriendStatus("sent");
      else setFriendStatus("received");
    });
    return unsub;
  }, [currentUid, id]);

  const sendRequest = async () => {
    if (friendStatus !== "none") return;
    setFriendStatus("sent");
    const rId = getReqId(currentUid, id);
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
  };

  const declineRequest = async () => {
    await deleteDoc(doc(db, "friendRequests", reqDocId));
  };

  const removeFriend = async () => {
    if (!window.confirm(`Удалить ${member.name} из друзей?`)) return;
    const { arrayRemove } = await import("firebase/firestore");
    await deleteDoc(doc(db, "friendRequests", reqDocId));
    await updateDoc(doc(db, "members", currentUid), { friends: arrayRemove(id) });
    await updateDoc(doc(db, "members", id), { friends: arrayRemove(currentUid) });
  };

  const blockUser = async () => {
    if (!window.confirm(`Заблокировать ${member.name}? Он не сможет писать тебе, а вы перестанете быть друзьями.`)) return;
    const { arrayRemove, arrayUnion } = await import("firebase/firestore");
    if (reqDocId) {
      await deleteDoc(doc(db, "friendRequests", reqDocId)).catch(() => {});
    }
    await updateDoc(doc(db, "members", currentUid), {
      friends: arrayRemove(id),
      blockedUsers: arrayUnion(id),
    });
    await updateDoc(doc(db, "members", id), { friends: arrayRemove(currentUid) });
  };

  const unblockUser = async () => {
    const { arrayRemove } = await import("firebase/firestore");
    await updateDoc(doc(db, "members", currentUid), { blockedUsers: arrayRemove(id) });
  };

  const openMemberStory = async () => {
    if (!memberStory) return;
    setViewingStory(true);
    if (id !== currentUid && !memberStory.viewedBy?.includes(currentUid)) {
      await updateDoc(doc(db, "stories", id), { viewedBy: arrayUnion(currentUid) });
      setMemberStory((prev) => ({ ...prev, viewedBy: [...(prev.viewedBy || []), currentUid] }));
    }
  };

  const deleteMemberStory = async () => {
    if (!window.confirm("Удалить свою историю?")) return;
    await deleteDoc(doc(db, "stories", id));
    setViewingStory(false);
    setMemberStory(null);
  };

  if (loading) return <div className="members-page"></div>;
  if (!member) return <div className="members-page">{t.members.notFound}</div>;

  const ringClass = memberStory
    ? (memberStory.viewedBy?.includes(currentUid) ? " story-ring viewed" : " story-ring unviewed")
    : "";

  return (
    <div className="members-page">
      <Link to="/members" className="member-back">{t.members.backToAll}</Link>

      <div className="member-profile-card">
        <div
          className={"member-avatar-wrap-large" + ringClass}
          onClick={openMemberStory}
          style={{ cursor: memberStory ? "pointer" : "default" }}
        >
          <div className="member-avatar large">
            {member.photoURL ? (
              <img src={member.photoURL} alt={member.name} />
            ) : (
              member.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          {member.lastActive && (Date.now() - new Date(member.lastActive).getTime()) < 120000 && (
            <span className="online-dot large"></span>
          )}
        </div>
        <h1 className="member-profile-name">{member.name}</h1>
        {member.showCity !== false && member.city && (
          <div className="member-city">{member.city}</div>
        )}
        {member.bio && <p className="member-profile-bio">{member.bio}</p>}

        {currentUid && currentUid !== id && blockedByMe && (
          <div className="member-actions">
            <div className="member-blocked-note">Вы заблокировали этого пользователя</div>
            <button className="member-friend-btn" onClick={unblockUser}>
              Разблокировать
            </button>
          </div>
        )}

        {currentUid && currentUid !== id && !blockedByMe && (
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
              <button className="member-friend-btn friends" onClick={removeFriend}>
                ✓ {t.friends.friendsLabel} (удалить)
              </button>
            )}

            <button className="member-block-link" onClick={blockUser}>
              Заблокировать
            </button>
          </div>
        )}
      </div>

      {viewingStory && memberStory && (
        <div className="story-viewer-overlay" onClick={() => setViewingStory(false)}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <span>{member.name}</span>
              {id === currentUid && (
                <button className="story-viewer-delete" onClick={deleteMemberStory}>Удалить</button>
              )}
              <button className="story-viewer-close" onClick={() => setViewingStory(false)}>✕</button>
            </div>
            <img src={memberStory.image} alt="" className="story-viewer-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberProfile;