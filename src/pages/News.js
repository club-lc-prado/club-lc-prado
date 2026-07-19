import { useState } from "react";
import "./TechInfo.css";
import newsBg from "../news-bg.jpg";

const newsItems = [
  {
    date: "19.07.2026",
    title: "Диагностика KDSS без разборки — на что смотреть",
    text: "Если у твоего Prado есть система KDSS (кинетическая подвеска), проверить её состояние можно на глаз, не залезая внутрь. Осмотри штоки гидроцилиндров — если они влажные, скорее всего нужна переборка. Сухие штоки при этом не гарантируют исправность: проблема может быть в электронике или датчиках. Быстрая визуальная проверка раз в сезон экономит нервы перед дальней поездкой.",
  },
  {
    date: "19.07.2026",
    title: "120, 150 или 250 — что выбрать",
    text: "Три поколения Prado живут в клубе бок о бок, и у каждого свой характер. 120-й — простая рамная классика, легко чинится в гараже. 150-й — золотая середина: комфорт, KDSS, разумная цена запчастей. 250-й — новые технологии и гибрид, но пока мало статистики по реальной эксплуатации в Европе. Если планируешь дальние экспедиции без сервиса под рукой — старшие модели проще держать на ходу самому.",
  },
  {
    date: "19.07.2026",
    title: "Лифт подвески — с чего начать",
    text: "Прежде чем поднимать машину, стоит пройти по порядку: оценить состояние текущей подвески, определиться с размером колёс, посчитать бюджет и найти установщика, который реально работал с Prado. И отдельный момент для Германии — любое изменение геометрии подвески может потребовать отдельного согласования (Einzelabnahme) перед прохождением TÜV. Разумнее выяснить это заранее, чем после установки.",
  },
  {
    date: "19.07.2026",
    title: "Почему групповые выезды безопаснее одиночных",
    text: "На бездорожье цена ошибки ниже, когда рядом есть кому помочь. Групповые покатушки — это не только про компанию, но и про реальную подстраховку: если один застрял, есть кому вытащить. Плюс это отличный повод обменяться контактами проверенных мастерских и мест для стоянки — такая база часто полезнее любого навигатора.",
  },
];

function News() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="static-page news-static-page">
      <div className="static-page-bg" style={{ backgroundImage: `url(${newsBg})` }}></div>
      <div className="static-page-overlay"></div>

      <div className="techinfo-content">
        <h1 className="static-page-title">Новости</h1>
        <div className="techinfo-underline"></div>

        <div className="techinfo-list">
          {newsItems.map((n, i) => (
            <div key={i} className={"techinfo-card" + (openIndex === i ? " open" : "")}>
              <button className="techinfo-card-header" onClick={() => toggle(i)}>
                <span>
                  <span className="news-date">{n.date}</span>
                  <span className="news-title">{n.title}</span>
                </span>
                <span className="techinfo-card-arrow">{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && (
                <div className="techinfo-card-body">
                  <p>{n.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default News;