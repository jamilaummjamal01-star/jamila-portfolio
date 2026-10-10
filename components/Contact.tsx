import { links } from "@/data/business-card";
import InstagramNotice from "./InstagramNotice";
export default function Contact() {
  return <section className="section contact" id="contact" aria-labelledby="contact-title">
    <div data-reveal><p className="eyebrow">06 / КОНТАКТЫ</p><h2 id="contact-title">ЕСТЬ ЗАДАЧА?<br />ДАВАЙТЕ СОБЕРЁМ<br />РЕШЕНИЕ.</h2>
      <p className="contact-intro">Расскажите о проекте и о том, что хочется изменить. Вместе определим, с чего начать.</p>
      <a className="button button-primary" href={links.telegram} target="_blank" rel="noopener noreferrer">Обсудить проект <span aria-hidden="true">↗</span></a></div>
    <div className="contact-panel" data-reveal><p className="eyebrow">СВЯЗАТЬСЯ</p><p className="contact-name">ДЖАМИЛЯ ШАКУРОВА</p>
      <address><a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-describedby="contact-instagram-notice"><span>Инстаграм<sup>*</sup></span><strong>@jamila.shakurova_ai</strong><span aria-hidden="true">↗</span></a>
        <a href={links.telegram} target="_blank" rel="noopener noreferrer"><span>Телеграм</span><strong>@jamilashakurovaai</strong><span aria-hidden="true">↗</span></a>
        <a href={links.email}><span>Почта</span><strong>jamila.shakurova@gmail.com</strong><span aria-hidden="true">↗</span></a></address>
      <InstagramNotice id="contact-instagram-notice" />
      <p className="micro contact-note">ПРОЕКТЫ · СОТРУДНИЧЕСТВО · КОНСУЛЬТАЦИИ</p></div>
  </section>;
}
