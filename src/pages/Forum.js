import "./TechInfo.css";
import forumBg from "../forum-bg.jpg";

function Forum() {
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${forumBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Форум</h1>
    </div>
  );
}

export default Forum;