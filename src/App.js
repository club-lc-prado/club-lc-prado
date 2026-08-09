import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { LanguageProvider } from "./i18n/LanguageContext";
import BootScreen from "./components/BootScreen";
import Sidebar from "./components/Sidebar";
import GuestLock from "./components/GuestLock";
import Home from "./pages/Home";
import About from "./pages/About";
import Forum from "./pages/Forum";
import NewTopic from "./pages/NewTopic";
import TopicDetail from "./pages/TopicDetail";
import Gallery from "./pages/Gallery";
import Useful from "./pages/Useful";
import Journeys from "./pages/Journeys";
import NewJourney from "./pages/NewJourney";
import JourneyDetail from "./pages/JourneyDetail";
import Shop from "./pages/Shop";
import Contacts from "./pages/Contacts";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Album from "./pages/Album";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Friends from "./pages/Friends";
import MapTest from "./pages/MapTest";
import AdminPanel from "./pages/AdminPanel";
import Videos from "./pages/Videos";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function App() {
  const [entered, setEntered] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ping = () => updateDoc(doc(db, "members", user.uid), { lastActive: new Date().toISOString() }).catch(() => {});
    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user || authLoading) return;

    let visitorId = localStorage.getItem("club_visitor_id");
    if (!visitorId) {
      visitorId = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("club_visitor_id", visitorId);
    }

    const getDeviceLabel = () => {
      const ua = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
      let os = "Неизвестно";
      if (/Windows/i.test(ua)) os = "Windows";
      else if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
      else if (/Mac/i.test(ua)) os = "Mac";
      else if (/Linux/i.test(ua)) os = "Linux";
      let browser = "Браузер";
      if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
      else if (/Firefox/i.test(ua)) browser = "Firefox";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Edg/i.test(ua)) browser = "Edge";
      return `${os} · ${browser} · ${isMobile ? "телефон" : "компьютер"}`;
    };

    const ping = () =>
      setDoc(
        doc(db, "visitors", visitorId),
        { lastActive: new Date().toISOString(), device: getDeviceLabel() },
        { merge: true }
      ).catch(() => {});
    ping();
    const interval = setInterval(ping, 60000);

    const locKnown = localStorage.getItem("club_visitor_loc_done");
    if (!locKnown) {
      fetch("https://ipwho.is/")
        .then((res) => res.json())
        .then((data) => {
          setDoc(
            doc(db, "visitors", visitorId),
            { country: data.country || "", city: data.city || "" },
            { merge: true }
          ).catch(() => {});
          localStorage.setItem("club_visitor_loc_done", "1");
        })
        .catch(() => {});
    }

    return () => clearInterval(interval);
  }, [user, authLoading]);

  return (
    <LanguageProvider>
      {!entered && <BootScreen user={user} onEnter={() => setEntered(true)} />}
      {entered && !authLoading && (
        <BrowserRouter>
          <Sidebar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/forum" element={<GuestLock><Forum /></GuestLock>} />
            <Route path="/forum/new" element={<GuestLock><NewTopic /></GuestLock>} />
            <Route path="/forum/:id" element={<GuestLock><TopicDetail /></GuestLock>} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/useful" element={<GuestLock><Useful /></GuestLock>} />
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/journeys/new" element={<NewJourney />} />
            <Route path="/journeys/:id" element={<JourneyDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contacts" element={<GuestLock><Contacts /></GuestLock>} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/feed" element={<GuestLock><Feed /></GuestLock>} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/settings" element={<GuestLock><Settings /></GuestLock>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/album" element={<Album />} />
            <Route path="/album/:uid" element={<Album />} />
            <Route path="/messages" element={<GuestLock><Messages /></GuestLock>} />
            <Route path="/messages/:userId" element={<GuestLock><Conversation /></GuestLock>} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/maptest" element={<MapTest />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </BrowserRouter>
      )}
    </LanguageProvider>
  );
}

export default App;