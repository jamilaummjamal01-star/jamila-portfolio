import { navigation } from "@/data/business-card";
export default function Footer() {
  return <footer className="site-footer"><div className="footer-top"><a className="brand-monogram" href="#top" aria-label="Наверх страницы">JS</a>
    <p className="micro">ТИХАЯ ЭСТЕТИКА. ТОЧНАЯ СИСТЕМА. ЭТИКА В КАЖДОЙ ДЕТАЛИ.</p>
    <nav aria-label="Навигация в подвале">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav></div>
    <div className="footer-bottom micro"><span>© 2026 ДЖАМИЛЯ ШАКУРОВА</span><a href="#top">НАВЕРХ ↑</a><span>ИДЕИ · ЛЮДИ · ТЕХНОЛОГИИ</span></div>
  </footer>;
}
