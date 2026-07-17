import "./TechInfo.css";
import galleryBg from "../gallery-bg.jpg";

function Gallery() {
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${galleryBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Галерея</h1>
    </div>
  );
}

export default Gallery;