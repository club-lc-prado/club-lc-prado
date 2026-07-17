import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import "./BootScreen.css";

import bootSound from "../boot-sequence.mp3";

const SEEN_KEY = "club_lc_prado_boot_seen";

function BootScreen({ onEnter, user }) {
  const { t } = useLanguage();
  const alreadySeen = localStorage.getItem(SEEN_KEY) === "true";
  const [stage, setStage] = useState("tap");
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef(null);

  const handleTap = () => {
    const audio = new Audio(bootSound);
    audioRef.current = audio;
    audio.play().catch(() => {});

    setStage("checking");
    setTimeout(() => setRevealed(true), 14000);
  };

  const enterClub = () => {
    localStorage.setItem(SEEN_KEY, "true");
    window.history.replaceState({}, "", user ? "/" : "/about");
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

  let step = 0;

  return (
    <div className="boot">
      <div className="boot-panel">
        <motion.div
          className="boot-model"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.model}
        </motion.div>

        <motion.div
          className="boot-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.systemCheck}
        </motion.div>

        {t.boot.items.map((item) => (
          <motion.div
            key={item}
            className="boot-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: step++ }}
          >
            <span>{item}</span>
            <span className="boot-item-status">✓ {t.boot.ready}</span>
          </motion.div>
        ))}

        <motion.div
          className="boot-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          <span>{t.boot.adventureMode}</span>
          <span>{t.boot.ready}</span>
        </motion.div>

        <motion.div
          className="boot-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.location}
        </motion.div>

        <motion.div
          className="boot-expedition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.nextExpedition}
        </motion.div>

        <motion.div
          className="boot-ready"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.systemReady}
        </motion.div>

        <motion.div
          className="boot-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.taglineLines[0]}
        </motion.div>

        <motion.div
          className="boot-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
        >
          {t.boot.taglineLines[1]}
        </motion.div>

        <motion.button
          className="boot-enter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: step++ }}
          onClick={enterClub}
          disabled={!revealed}
        >
          {t.boot.enter}
        </motion.button>
      </div>
    </div>
  );
}

export default BootScreen;