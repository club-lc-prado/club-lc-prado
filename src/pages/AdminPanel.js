import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, getDocs, query, where, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import germanyMapBg from "../germany-map-bg.jpg";
import "./AdminPanel.css";

const ADMIN_EMAIL = "pp.stela.ua@gmail.com";

function AdminPanel() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null);
  const [tab, setTab] = useState("specialists");

  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({ members: 0, posts: 0, journeys: 0, totalVisitors: 0, onlineGuests: 0 });
  const [editing, setEditing] = useState(null);
  const [pickedPos, setPickedPos] = useState(null);

  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [reports, setReports] = useState([]);
  const [openConvId, setOpenConvId] = useState(null);
  const [reportMessages, setReportMessages] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        setAllowed(false);
        navigate("/");
        return;
      }
      setAllowed(true);
      loadPending();
      loadMembers();
      loadPosts();
      loadTopics();
      loadReports();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadPending = async () => {
    const q = query(collection(db, "specialists"), where("approved", "==", false));
    const snap = await getDocs(q);
    setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    loadStats();
  };

  const loadStats = async () => {
    const [membersSnap, postsSnap, journeysSnap, visitorsSnap] = await Promise.all([
      getDocs(collection(db, "members")),
      getDocs(collection(db, "posts")),
      getDocs(collection(db, "journeys")),
      getDocs(collection(db, "visitors")),
    ]);
    const now = Date.now();
    const onlineGuests = visitorsSnap.docs.filter(
      (d) => now - new Date(d.data().lastActive).getTime() < 120000
    ).length;
    setStats({
      members: membersSnap.size,
      posts: postsSnap.size,
      journeys: journeysSnap.size,
      totalVisitors: visitorsSnap.size,
      onlineGuests,
    });
  };

  const loadMembers = async () => {
    const snap = await getDocs(collection(db, "members"));
    setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const loadPosts = async () => {
    const snap = await getDocs(collection(db, "posts"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setPosts(list);
  };

  const loadTopics = async () => {
    const snap = await getDocs(collection(db, "topics"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setTopics(list);
  };

  const loadReports = async () => {
    const snap = await getDocs(collection(db, "reports"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setReports(list);
  };

  const viewReportedChat = async (r) => {
    setOpenConvId(r.conversationId);
    const snap = await getDocs(collection(db, "conversations", r.conversationId, "messages"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setReportMessages(list);
  };

  const resolveReport = async (r) => {
    await updateDoc(doc(db, "reports", r.id), { status: "resolved" });
    setOpenConvId(null);
    loadReports();
  };

  const openMapFor = (req) => {
    setEditing(req);
    setPickedPos(null);
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
    const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
    setPickedPos({ x, y });
  };

  const handleApprove = async () => {
    if (!editing || !pickedPos) return;
    await updateDoc(doc(db, "specialists", editing.id), {
      approved: true,
      x: parseFloat(pickedPos.x),
      y: parseFloat(pickedPos.y),
    });
    setEditing(null);
    setPickedPos(null);
    loadPending();
  };

  const handleReject = async (req) => {
    if (!window.confirm(`Отклонить заявку от ${req.name}?`)) return;
    await deleteDoc(doc(db, "specialists", req.id));
    loadPending();
  };

  const toggleBan = async (m) => {
    await updateDoc(doc(db, "members", m.id), { banned: !m.banned });
    loadMembers();
  };

  const deleteMember = async (m) => {
    if (!window.confirm(`Удалить профиль участника "${m.name}" навсегда? Это не удалит его логин, только профиль и данные.`)) return;
    await deleteDoc(doc(db, "members", m.id));
    loadMembers();
    loadStats();
  };

  const deletePost = async (p) => {
    if (!window.confirm("Удалить этот пост навсегда?")) return;
    await deleteDoc(doc(db, "posts", p.id));
    loadPosts();
    loadStats();
  };

  const deleteTopic = async (tItem) => {
    if (!window.confirm(`Удалить тему "${tItem.title}" навсегда?`)) return;
    await deleteDoc(doc(db, "topics", tItem.id));
    loadTopics();
  };

  if (allowed === null) return <div className="admin-page"></div>;
  if (!allowed) return null;

  return (
    <div className="admin-page">
      <h1 className="admin-title">Админ-панель</h1>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.members}</div>
          <div className="admin-stat-label">Участников</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.posts}</div>
          <div className="admin-stat-label">Постов</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.journeys}</div>
          <div className="admin-stat-label">Кличей</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.totalVisitors}</div>
          <div className="admin-stat-label">Гостей всего</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.onlineGuests}</div>
          <div className="admin-stat-label">Гостей сейчас</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={"admin-tab" + (tab === "specialists" ? " active" : "")} onClick={() => setTab("specialists")}>
          Заявки специалистов ({pending.length})
        </button>
        <button className={"admin-tab" + (tab === "members" ? " active" : "")} onClick={() => setTab("members")}>
          Участники ({members.length})
        </button>
        <button className={"admin-tab" + (tab === "posts" ? " active" : "")} onClick={() => setTab("posts")}>
          Посты ({posts.length})
        </button>
        <button className={"admin-tab" + (tab === "forum" ? " active" : "")} onClick={() => setTab("forum")}>
          Форум ({topics.length})
        </button>
        <button className={"admin-tab" + (tab === "reports" ? " active" : "")} onClick={() => setTab("reports")}>
          Жалобы ({reports.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {tab === "specialists" && (
        <div>
          {pending.length === 0 && <div className="admin-empty">Новых заявок нет.</div>}
          <div className="admin-list">
            {pending.map((req) => (
              <div key={req.id} className="admin-card">
                <div className="admin-card-name">{req.name}</div>
                <div className="admin-card-row">Языки: {req.languages?.join(", ")}</div>
                <div className="admin-card-row">Направления: {req.directions?.join(", ")}</div>
                <div className="admin-card-row">Адрес: {req.address}</div>
                <div className="admin-card-row">Телефон: {req.phone}</div>
                <div className="admin-card-row">
                  Мессенджеры: {[req.whatsapp && "WhatsApp", req.telegram && "Telegram", req.viber && "Viber", req.signal && "Signal"].filter(Boolean).join(", ") || "—"}
                </div>
                <div className="admin-card-actions">
                  <button className="admin-btn-approve" onClick={() => openMapFor(req)}>
                    Указать место на карте и подтвердить
                  </button>
                  <button className="admin-btn-reject" onClick={() => handleReject(req)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="admin-list">
          {members.map((m) => (
            <div key={m.id} className="admin-card admin-card-row-layout">
              <div className="admin-member-avatar">
                {m.photoURL ? <img src={m.photoURL} alt={m.name} /> : m.name?.[0]?.toUpperCase()}
              </div>
              <div className="admin-member-info">
                <div className="admin-card-name">
                  {m.name} {m.banned && <span className="admin-banned-tag">ЗАБАНЕН</span>}
                </div>
                <div className="admin-card-row">{m.email} · {m.city}</div>
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn-reject" onClick={() => toggleBan(m)}>
                  {m.banned ? "Разбанить" : "Забанить"}
                </button>
                <button className="admin-btn-reject" onClick={() => deleteMember(m)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "posts" && (
        <div className="admin-list">
          {posts.length === 0 && <div className="admin-empty">Постов нет.</div>}
          {posts.map((p) => (
            <div key={p.id} className="admin-card admin-card-row-layout">
              {p.image && (
                <img src={p.image} alt="" className="admin-post-thumb" />
              )}
              <div className="admin-member-info">
                <div className="admin-card-name">{p.authorName}</div>
                {p.text && <div className="admin-card-row">{p.text.slice(0, 100)}</div>}
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn-reject" onClick={() => deletePost(p)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "forum" && (
        <div className="admin-list">
          {topics.length === 0 && <div className="admin-empty">Тем нет.</div>}
          {topics.map((tItem) => (
            <div key={tItem.id} className="admin-card admin-card-row-layout">
              <div className="admin-member-info">
                <div className="admin-card-name">{tItem.title}</div>
                <div className="admin-card-row">Автор: {tItem.authorName}</div>
              </div>
              <div className="admin-card-actions">
                <button className="admin-btn-reject" onClick={() => deleteTopic(tItem)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="admin-list">
          {reports.length === 0 && <div className="admin-empty">Жалоб нет.</div>}
          {reports.map((r) => (
            <div key={r.id} className="admin-card">
              <div className="admin-card-name">
                {r.reportedByName} → {r.otherUserName} {r.status === "resolved" && <span className="admin-banned-tag" style={{ color: "#8FA37E" }}>решено</span>}
              </div>
              <div className="admin-card-row">Причина: {r.reason}</div>
              <div className="admin-card-actions">
                <button className="admin-btn-approve" onClick={() => viewReportedChat(r)}>
                  Посмотреть переписку
                </button>
                {r.status === "pending" && (
                  <button className="admin-btn-reject" onClick={() => resolveReport(r)}>
                    Отметить решённым
                  </button>
                )}
              </div>

              {openConvId === r.conversationId && (
                <div className="admin-chat-view">
                  {reportMessages.map((m) => (
                    <div key={m.id} className="admin-chat-msg">
                      <b>{m.senderId === r.reportedBy ? r.reportedByName : r.otherUserName}:</b> {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="admin-map-overlay" onClick={() => setEditing(null)}>
          <div className="admin-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-map-title">Кликни на карте, где находится {editing.name}</div>
            <div
              className="admin-map-wrap"
              style={{ backgroundImage: `url(${germanyMapBg})` }}
              onClick={handleMapClick}
            >
              {pickedPos && (
                <div
                  className="admin-map-marker"
                  style={{ left: `${pickedPos.x}%`, top: `${pickedPos.y}%` }}
                ></div>
              )}
            </div>
            <div className="admin-map-actions">
              <button
                className="admin-btn-approve"
                onClick={handleApprove}
                disabled={!pickedPos}
              >
                Подтвердить и опубликовать
              </button>
              <button className="admin-btn-reject" onClick={() => setEditing(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;