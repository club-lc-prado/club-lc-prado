import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./YearCalendar.css";

const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

function MiniMonth({ year, month, journeysByDate, onDayClick }) {
  const { lang } = useLanguage();

  const monthLabel = new Date(year, month, 1).toLocaleDateString(localeMap[lang] || "ru-RU", {
    month: "long",
  });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="year-cal-month">
      <div className="year-cal-month-label">{monthLabel}</div>
      <div className="year-cal-grid">
        {cells.map((d, i) => {
          const key = d ? dateKey(d) : null;
          const hasEvent = d && journeysByDate[key]?.length > 0;
          return (
            <button
              key={i}
              className={
                "year-cal-day" +
                (!d ? " empty" : "") +
                (hasEvent ? " has-event" : "") +
                (d && isToday(d) ? " today" : "")
              }
              onClick={() => d && onDayClick(dateKey(d))}
              disabled={!d}
            >
              {d || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearCalendar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [journeysByDate, setJourneysByDate] = useState({});

  const year = new Date().getFullYear();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "journeys"));
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.date) return;
        if (!map[data.date]) map[data.date] = [];
        map[data.date].push({ id: d.id, ...data });
      });
      setJourneysByDate(map);
    };
    load();
  }, []);

  const handleDayClick = (key) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const events = journeysByDate[key];
    if (events && events.length > 0) {
      navigate(`/journeys/${events[0].id}`);
    } else {
      navigate(`/journeys/new?date=${key}`);
    }
  };

  return (
    <div className="year-cal">
      {[...Array(12)].map((_, m) => (
        <MiniMonth
          key={m}
          year={year}
          month={m}
          journeysByDate={journeysByDate}
          onDayClick={handleDayClick}
        />
      ))}
    </div>
  );
}

export default YearCalendar;