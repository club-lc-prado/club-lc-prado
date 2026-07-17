import "./TechInfo.css";
import newsBg from "../news-bg.jpg";

function News() {
  return (
    <div className="static-page news-static-page" style={{ backgroundImage: `url(${newsBg})` }}>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Новости</h1>
    </div>
  );
}

export default News;