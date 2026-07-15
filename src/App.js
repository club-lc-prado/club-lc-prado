import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import BootScreen from "./components/BootScreen";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import News from "./pages/News";
import Forum from "./pages/Forum";
import Gallery from "./pages/Gallery";
import TechInfo from "./pages/TechInfo";
import Journeys from "./pages/Journeys";
import Clubs from "./pages/Clubs";
import Shop from "./pages/Shop";
import Contacts from "./pages/Contacts";

function App() {
  const [entered, setEntered] = useState(false);

  return (
    <LanguageProvider>
      {!entered && <BootScreen onEnter={() => setEntered(true)} />}
      {entered && (
        <BrowserRouter>
          <Sidebar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/tech-info" element={<TechInfo />} />
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </BrowserRouter>
      )}
    </LanguageProvider>
  );
}

export default App;