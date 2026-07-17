import techInfoBg from "../techinfo-bg.jpg";
import "./TechInfo.css";

function TechInfo() {
  return (
    <div className="static-page" style={{ backgroundImage: `url(${techInfoBg})` }}>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Тех.инфо</h1>
    </div>
  );
}

export default TechInfo;