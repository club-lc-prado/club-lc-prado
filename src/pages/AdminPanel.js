import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import germanyMapBg from "../germany-map-bg.jpg";
import "./AdminPanel.css";

const ADMIN_EMAIL = "pp.stela.ua@gmail.com";

function AdminPanel() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({ members: 0, posts: 0, journeys: 0 });
  const [editing, setEditing] = useState(null);
  const [pickedPos, setPickedPos] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        setAllowed(false);
        navigate("/");
        return;
      }
      setAllowed(true);
      loadPending();
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
    const [membersSnap, postsSnap, journeysSnap] = await Promise.all([
      getDocs(collection(db, "members")),
      getDocs(collection(db, "posts")),
      getDocs(collection(db, "journeys")),
    ]);
    setStats({
      members: membersSnap.size,
      posts: postsSnap.size,
      journeys: journeysSnap.size,
    });
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
      </div>

      <div className="admin-section-label">Заявки специалистов ({pending.length})</div>

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