import { useLanguage } from "../i18n/LanguageContext";
import "./About.css";
import aboutBg from "../about-bg.jpg";

function About() {
  const { t } = useLanguage();

  return (
    <div className="about-static">
      <div className="about-bg-fixed" style={{ backgroundImage: `url(${aboutBg})` }}></div>
      <div className="about-bg-overlay"></div>

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
    </div>
  );
}

export default About;