import { useLanguage } from "../i18n/LanguageContext";
import "./About.css";

function About() {
  const { t } = useLanguage();

  return (
    <div className="about-static">
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