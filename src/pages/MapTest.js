import { useEffect, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { select } from "d3-selection";
import { zoom as d3zoom } from "d3-zoom";
import worldTopo from "world-atlas/countries-110m.json";

function MapTest() {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [countries, setCountries] = useState(null);

  const WIDTH = 900;
  const HEIGHT = 700;

  useEffect(() => {
    const geo = feature(worldTopo, worldTopo.objects.countries);
    setCountries(geo);
  }, []);

  useEffect(() => {
    if (!countries) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior = d3zoom()
      .scaleExtent([1, 20])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    return () => svg.on(".zoom", null);
  }, [countries]);

  if (!countries) {
    return <div style={{ background: "#000", color: "#D4B26A", padding: 40 }}>Загрузка карты...</div>;
  }

  const projection = geoNaturalEarth1()
    .center([70, 50])
    .scale(500)
    .translate([WIDTH / 2, HEIGHT / 2]);

  const pathGen = geoPath(projection);

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: 20, boxSizing: "border-box" }}>
      <div style={{ color: "#D4B26A", fontFamily: "monospace", textAlign: "center", marginBottom: 12 }}>
        ТЕСТ: карта Евразии (мышь: колесо = зум, тащить = перемещение)
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: "80vh", background: "#000" }}
      >
        <g ref={gRef}>
          {countries.features.map((f, i) => (
            <path
              key={i}
              d={pathGen(f)}
              fill="rgba(20,20,20,0.8)"
              stroke="#D4B26A"
              strokeWidth="0.5"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default MapTest;