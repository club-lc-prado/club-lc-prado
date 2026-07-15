import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import "./BootScreen.css";

function BootScreen({ onEnter }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState("tap");

  const handleTap = () => {
    setStage("checking");
    setTimeout(() => setStage("ready"), t.boot.items.length * 400 + 900);
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
            transition={{ delay: i * 0.4 }}
          >
            <span>{item}</span>
            <motion.span
              className="boot-item-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.4 + 0.25 }}
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