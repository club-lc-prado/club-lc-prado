import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../i18n/LanguageContext";
import "./Register.css";
import joinBg from "../auth-bg.jpg";

function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: "", city: "", email: "", password: "" });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 400;
        const scale = Math.max(size / img.width, size / img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        setPhotoPreview(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!photoPreview) {
      setError(t.auth.photoRequired);
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });

      await setDoc(doc(db, "members", cred.user.uid), {
        name: form.name,
        city: form.city,
        email: form.email,
        prado: "",
        bio: "",
        photoURL: photoPreview,
        visibleInCatalog: true,
        showCity: true,
        createdAt: new Date().toISOString(),
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-fixed" style={{ backgroundImage: `url(${joinBg})` }}></div>
      <div className="auth-bg-overlay"></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">{t.auth.registerTitle}</h1>
        <p className="auth-notice">{t.auth.notice}</p>

        <div className="auth-photo-upload-wrap">
          <div className="auth-photo-upload" onClick={() => fileInputRef.current?.click()}>
            {photoPreview ? (
              <img src={photoPreview} alt="avatar" className="auth-photo-preview" />
            ) : (
              <div className="auth-photo-placeholder">
                <span>+</span>
                <span className="auth-photo-label">{t.auth.addPhoto}</span>
              </div>
            )}
          </div>
          <span className="auth-required-star">*</span>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handlePhotoSelect}
          style={{ display: "none" }}
        />

        <div className="auth-field">
          <input
            type="text"
            name="name"
            placeholder={t.auth.namePlaceholder}
            value={form.name}
            onChange={handleChange}
            required
          />
          <span className="auth-required-star">*</span>
        </div>

        <div className="auth-field">
          <input
            type="text"
            name="city"
            placeholder={t.auth.cityPlaceholder}
            value={form.city}
            onChange={handleChange}
            required
          />
          <span className="auth-required-star">*</span>
        </div>

        <div className="auth-field">
          <input
            type="email"
            name="email"
            placeholder={t.auth.emailPlaceholder}
            value={form.email}
            onChange={handleChange}
            required
          />
          <span className="auth-required-star">*</span>
        </div>

        <div className="auth-field">
          <input
            type="password"
            name="password"
            placeholder={t.auth.passwordPlaceholder}
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <span className="auth-required-star">*</span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? t.auth.creating : t.auth.registerBtn}
        </button>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-switch">
          {t.auth.haveAccount} <Link to="/login">{t.auth.loginBtn}</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;