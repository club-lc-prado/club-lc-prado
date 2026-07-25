import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./HomeCalendar.css";

const localeMap = { ru: "ru-RU", de: "de-DE", en: "en-US", ua: "uk-UA" };

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getGermanHolidays(year) {
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    return nd;
  };

  const easter = getEasterSunday(year);
  const dates = [
    new Date(year, 0, 1),
    addDays(easter, -2),
    addDays(easter, 1),
    new Date(year, 4, 1),
    addDays(easter, 39),
    addDays(easter, 50),
    new Date(year, 9, 3),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ];

  const set = new Set();
  dates.forEach((d) => set.add(key(d)));
  return set;
}

function HomeCalendar() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [journeysByDate, setJourneysByDate] = useState({});

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString(localeMap[lang] || "ru-RU", {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels = [...Array(7)].map((_, i) => {
    const d = new Date(2024, 0, i + 1);
    return d.toLocaleDateString(localeMap[lang] || "ru-RU", { weekday: "short" }).slice(0, 2);
  });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const holidays = getGermanHolidays(year);

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isWeekend = (d) => {
    const wd = new Date(year, month, d).getDay();
    return wd === 0 || wd === 6;
  };

  const handleDayClick = (d) => {
    if (!d) return;
    const key = dateKey(d);
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

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="home-calendar">
      <div className="home-calendar-header">
        <button onClick={prevMonth} aria-label="prev">‹</button>
        <span className="home-calendar-month">{monthLabel}</span>
        <button onClick={nextMonth} aria-label="next">›</button>
      </div>

      <div className="home-calendar-weekdays">
        {weekdayLabels.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="home-calendar-grid">
        {cells.map((d, i) => {
          const key = d ? dateKey(d) : null;
          const hasEvent = d && journeysByDate[key]?.length > 0;
          const isHoliday = d && holidays.has(key);
          const weekend = d && isWeekend(d);
          return (
            <button
              key={i}
              className={
                "home-calendar-day" +
                (!d ? " empty" : "") +
                (hasEvent ? " has-event" : "") +
                (d && isToday(d) ? " today" : "") +
                ((weekend || isHoliday) ? " weekend" : "")
              }
              onClick={() => handleDayClick(d)}
              disabled={!d}
            >
              {d || ""}
              {hasEvent && <span className="home-calendar-dot"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HomeCalendar;