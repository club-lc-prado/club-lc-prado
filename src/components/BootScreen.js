import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import "./BootScreen.css";

import zamkiSound from "../zamki-chisto.mp3";
import mirrorSound from "../mirror-click.mp3";
import dvigatelSound from "../dvigatel-studio.mp3";

const TOTAL_SOUND_MS = 28000;
const ITEM_DELAY = 5.3;

function BootScreen({ onEnter }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState("tap");
  const audioRef = useRef(null);

  const playSequence = (sounds, index = 0) => {
    if (index >= sounds.length) return;
    const audio = new Audio(sounds[index]);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => playSequence(sounds, index + 1);
  };

  const handleTap = () => {
    playSequence([zamkiSound, mirrorSound, dvigatelSound]);
    setStage("checking");
    setTimeout(() => setStage("ready"), TOTAL_SOUND_MS);
  };

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

              <button className="boot-enter" onClick={onEnter}>
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