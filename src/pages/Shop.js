import "./TechInfo.css";
import shopBg from "../shop-bg.jpg";

function Shop() {
  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${shopBg})` }}></div>
      <div className="static-page-overlay"></div>
      <h1 className="static-page-title">Магазин</h1>
    </div>
  );
}

export default Shop;