import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import "./BootScreen.css";

import bootSound from "../boot-sequence.mp3";

const TOTAL_SOUND_MS = 14000;
const ITEM_DELAY = 2.6;
const SEEN_KEY = "club_lc_prado_boot_seen";

function BootScreen({ onEnter }) {
  const { t } = useLanguage();
  const alreadySeen = localStorage.getItem(SEEN_KEY) === "true";
  const [stage, setStage] = useState("tap");
  const audioRef = useRef(null);

  const handleTap = () => {
    const audio = new Audio(bootSound);
    audioRef.current = audio;
    audio.play().catch(() => {});

    setStage("checking");
    setTimeout(() => setStage("ready"), TOTAL_SOUND_MS);

    if (navigator.vibrate) {
      setTimeout(() => {
        const rumble = [];
        for (let i = 0; i < 20; i++) rumble.push(150, 50);
        navigator.vibrate(rumble);
      }, TOTAL_SOUND_MS - 4000);
    }
  };

  const enterClub = () => {
    localStorage.setItem(SEEN_KEY, "true");
    onEnter();
  };

  if (alreadySeen) {
    return (
      <div className="boot" onClick={enterClub}>
        <div className="boot-tap">{t.boot.tap}</div>
      </div>
    );
  }

  if (stage === "tap") {
    return (
      <div className="boot" onClick={handleTap}>
        <div className="boot-tap">{t.boot.tap}</div>
      </div>
    );
  }

  return (
    <div className="boot">
      <div className="boot-panel">
        <div className="boot-model">{t.boot.model}</div>
        <div className="boot-sub">{t.boot.systemCheck}</div>

        {t.boot.items.map((item, i) => (
          <motion.div
            key={item}
            className="boot-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * ITEM_DELAY }}
          >
            <span>{item}</span>
            <motion.span
              className="boot-item-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * ITEM_DELAY + 0.3 }}
            >
              ✓ {t.boot.ready}
            </motion.span>
          </motion.div>
        ))}

        <AnimatePresence>
          {stage === "ready" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="boot-mode">
                <span>{t.boot.adventureMode}</span>
                <span>{t.boot.ready}</span>
              </div>

              <div className="boot-stats">{t.boot.location}</div>
              <div className="boot-expedition">{t.boot.nextExpedition}</div>

              <div className="boot-ready">{t.boot.systemReady}</div>
              <div className="boot-tagline">{t.boot.tagline}</div>

              <button className="boot-enter" onClick={enterClub}>
                {t.boot.enter}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BootScreen;