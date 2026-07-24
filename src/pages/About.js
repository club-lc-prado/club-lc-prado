import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./About.css";
import aboutBg from "../about-bg.jpg";

function About() {
  const { t } = useLanguage();
  const wrapRef = useRef(null);
  const contentRef = useRef(null);
  const [maxScroll, setMaxScroll] = useState(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      if (wrapRef.current && contentRef.current) {
        const diff = contentRef.current.scrollHeight - wrapRef.current.clientHeight;
        setMaxScroll(Math.max(0, diff) + 60);
      }
    };
    measure();
    const t1 = setTimeout(measure, 500);
    const t2 = setTimeout(measure, 1500);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [t]);

  useEffect(() => {
    const speed = window.innerWidth < 900 ? 1.4 : 0.7;
    const startTime = Date.now();
    const startDelay = 3000;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (!pausedRef.current && contentRef.current && elapsed > startDelay) {
        offsetRef.current = Math.min(offsetRef.current + speed, maxScroll);
        contentRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [maxScroll]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    pausedRef.current = true;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const delta = touchStartY.current - currentY;
    touchStartY.current = currentY;
    offsetRef.current = Math.min(Math.max(offsetRef.current + delta, 0), maxScroll);
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
    }
  };

  const handleTouchEnd = () => {
    pausedRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    offsetRef.current = Math.min(Math.max(offsetRef.current + e.deltaY, 0), maxScroll);
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
    }
  };

  return (
    <div className="about-static">
      <div className="about-bg-fixed" style={{ backgroundImage: `url(${aboutBg})` }}></div>
      <div className="about-bg-overlay"></div>

      <div
        className="about-scroll-wrap"
        ref={wrapRef}
        onMouseDown={pause}
        onMouseUp={resume}
        onMouseLeave={resume}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div className="about-scroll-content" ref={contentRef}>
          <h1 className="about-title">{t.about.title}</h1>
          <div className="about-underline"></div>
          <div className="about-text">
            {t.about.paragraphs.map((p, i) => {
              const isEmphasis = p.split(" ").length <= 4;
              return (
                <p key={i} className={"about-paragraph" + (isEmphasis ? " emphasis" : "")}>
                  {p}
                </p>
              );
            })}
          </div>

          <div className="about-cta">
            <div className="about-cta-text">Хочешь присоединиться?</div>
            <Link to="/register" className="about-cta-link">
              СТАТЬ ЧАСТЬЮ КЛУБА
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;