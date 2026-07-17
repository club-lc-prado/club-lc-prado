import "./TechInfo.css";
import techInfoBg from "../techinfo-bg.jpg";

function TechInfo() {
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${techInfoBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Тех.инфо</h1>
    </div>
  );
}

export default TechInfo;