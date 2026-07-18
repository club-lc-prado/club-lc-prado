import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { LanguageProvider } from "./i18n/LanguageContext";
import BootScreen from "./components/BootScreen";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import About from "./pages/About";
import News from "./pages/News";
import Forum from "./pages/Forum";
import Gallery from "./pages/Gallery";
import TechInfo from "./pages/TechInfo";
import Journeys from "./pages/Journeys";
import Shop from "./pages/Shop";
import Contacts from "./pages/Contacts";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import NewJourney from "./pages/NewJourney";
import JourneyDetail from "./pages/JourneyDetail";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

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

  return (
    <LanguageProvider>
      {!entered && <BootScreen user={user} onEnter={() => setEntered(true)} />}
      {entered && !authLoading && (
        <BrowserRouter>
          <Sidebar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/news" element={<News />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/tech-info" element={<TechInfo />} />
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/journeys/new" element={<NewJourney />} />
            <Route path="/journeys/:id" element={<JourneyDetail />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/feed" element={<Feed />} />
          </Routes>
        </BrowserRouter>
      )}
    </LanguageProvider>
  );
}

export default App;