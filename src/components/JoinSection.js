import { useState } from "react";
import emailjs from "@emailjs/browser";
import { useLanguage } from "../i18n/LanguageContext";
import "./JoinSection.css";
import joinBg from "../join-bg.jpg";

const SERVICE_ID = "YOUR_SERVICE_ID";
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const PUBLIC_KEY = "YOUR_PUBLIC_KEY";

function JoinSection() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", city: "", model: "" });
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");

    emailjs
      .send(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY)
      .then(() => {
        setStatus("success");
        setForm({ name: "", city: "", model: "" });
      })
      .catch(() => setStatus("error"));
  };

  return (
    <div className="join" style={{ backgroundImage: `url(${joinBg})` }}>
      <div className="join-inner">
        <h2 className="join-title">{t.join.title}</h2>
        <p className="join-subtitle">{t.join.subtitle}</p>

        <form className="join-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder={t.join.name}
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="city"
            placeholder={t.join.city}
            value={form.city}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="model"
            placeholder={t.join.model}
            value={form.model}
            onChange={handleChange}
            required
          />
          <button className="join-submit" type="submit" disabled={status === "sending"}>
            {status === "sending" ? t.join.sending : t.join.submit}
          </button>
        </form>

        {status === "success" && (
          <div className="join-message success">{t.join.success}</div>
        )}
        {status === "error" && (
          <div className="join-message error">{t.join.error}</div>
        )}
      </div>
    </div>
  );
}

export default JoinSection;