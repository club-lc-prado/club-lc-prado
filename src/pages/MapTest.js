import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import { zoom as d3zoom } from "d3-zoom";

const TEST_SPECIALISTS = [
  { id: "test1", name: "Юрий", lat: 53.08, lng: 8.8 },
  { id: "test2", name: "Иван", lat: 52.37, lng: 9.73 },
];

function MapTest() {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [geoData, setGeoData] = useState(null);

  const WIDTH = 500;
  const HEIGHT = 650;

  useEffect(() => {
    fetch("/germany-states.json")
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error("map fetch error", err));
  }, []);

  useEffect(() => {
    if (!geoData) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior = d3zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    return () => svg.on(".zoom", null);
  }, [geoData]);

  if (!geoData) {
    return <div style={{ background: "#000", color: "#D4B26A", padding: 40 }}>Загрузка карты Германии...</div>;
  }

  const projection = geoMercator().fitSize([WIDTH, HEIGHT], geoData);
  const pathGen = geoPath(projection);

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: 20, boxSizing: "border-box" }}>
      <div style={{ color: "#D4B26A", fontFamily: "monospace", textAlign: "center", marginBottom: 12 }}>
        ТЕСТ: карта Германии (настоящие данные)
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", maxWidth: 500, display: "block", margin: "0 auto", background: "#000" }}
      >
        <g ref={gRef}>
          {geoData.features.map((f) => (
            <path
              key={f.properties.id}
              d={pathGen(f)}
              fill="rgba(20,20,20,0.7)"
              stroke="#D4B26A"
              strokeWidth="1"
            />
          ))}
          {TEST_SPECIALISTS.map((s) => {
            const coords = projection([s.lng, s.lat]);
            if (!coords) return null;
            return (
              <circle key={s.id} cx={coords[0]} cy={coords[1]} r="6" fill="#D4B26A" />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default MapTest;