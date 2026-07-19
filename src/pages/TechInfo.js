import { useState } from "react";
import "./TechInfo.css";
import techInfoBg from "../techinfo-bg.jpg";

const articles = [
  {
    title: "Частые проблемы по поколениям",
    content: [
      "J120 (2002–2009): ржавление задних лонжеронов и порогов в северном климате, течь сальника раздатки, износ втулок стабилизатора после 150 тыс. км.",
      "J150 (2009–2017, рестайлинги до 2020): проблемы с турбиной на дизельных версиях после 200 тыс. км, скрип передней подвески, отказ датчиков VSC на ранних выпусках.",
      "J250 (с 2023): пока мало статистики по эксплуатации в Европе — гибридная версия новая, стоит следить за отзывными кампаниями Toyota.",
    ],
  },
  {
    title: "Что проверять при покупке б/у",
    content: [
      "История обслуживания раздатки и мостов — часто игнорируется предыдущими владельцами.",
      "Следы сварки на лонжеронах и порогах — маркер скрытой коррозии или ДТП.",
      "Работа полного привода на всех режимах (H, L, Lock) — тестировать вживую, не по приборной панели.",
      "Состояние резинометаллических втулок подвески — стук на кочках означает скорую замену.",
      "Для дизелей — сажевый фильтр (DPF) и его историю прожига.",
    ],
  },
  {
    title: "Дополнительное оборудование",
    content: [
      "Шноркель — актуален при бродах и пыльных покатушках, для городской эксплуатации не нужен.",
      "Лебёдка — передний бампер должен быть рассчитан на её вес, проверять совместимость крепления.",
      "Защита картера и раздатки — базовая рекомендация для любых внедорожных выездов.",
      "Багажник на крышу — учитывать ограничение по нагрузке (обычно 100–150 кг в движении).",
    ],
  },
  {
    title: "Обслуживание в Германии — на что закладываться",
    content: [
      "TÜV/HU каждые 2 года — для внедорожников с изменённой геометрией (шноркель, лифт подвески) может потребоваться отдельное согласование (Einzelabnahme).",
      "Замена масла в раздатке и мостах — многие сервисы забывают об этом при обычном ТО, спрашивать отдельно.",
      "Запчасти на старые J120 — искать через специализированные Land Cruiser клубы и разборки, не всегда есть у официального дилера.",
    ],
  },
];

function TechInfo() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${techInfoBg})` }}></div>
      <div className="static-page-overlay"></div>

      <div className="techinfo-content">
        <h1 className="static-page-title">Тех.инфо</h1>
        <div className="techinfo-underline"></div>

        <div className="techinfo-list">
          {articles.map((a, i) => (
            <div key={i} className={"techinfo-card" + (openIndex === i ? " open" : "")}>
              <button className="techinfo-card-header" onClick={() => toggle(i)}>
                <span>{a.title}</span>
                <span className="techinfo-card-arrow">{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && (
                <div className="techinfo-card-body">
                  {a.content.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TechInfo;