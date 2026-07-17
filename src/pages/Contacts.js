import "./TechInfo.css";
import contactsBg from "../contacts-bg.jpg";

function Contacts() {
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${contactsBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Контакты</h1>
    </div>
  );
}

export default Contacts;