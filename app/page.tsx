"use client";

import { useEffect } from "react";

const services = [
  {
    number: "01",
    title: "Нейрофото товара",
    text: "Премиальные предметные кадры для каталогов, социальных сетей, маркетплейсов и рекламных кампаний.",
    accent: "rose",
  },
  {
    number: "02",
    title: "AI-видео и Reels",
    text: "Короткие рекламные ролики, анимация продукта и визуальные истории без сложной съёмочной команды.",
    accent: "olive",
  },
  {
    number: "03",
    title: "Презентации и PDF-гайды",
    text: "Структурные и эстетичные материалы для продуктов, обучения, марафонов, предложений и личного бренда.",
    accent: "gold",
  },
  {
    number: "04",
    title: "Интерактивные конструкторы",
    text: "Диагностики, квизы и digital-инструменты, которые вовлекают аудиторию и помогают собрать точные данные.",
    accent: "mocha",
  },
  {
    number: "05",
    title: "AI-аватары и анимация",
    text: "Динамичный контент для экспертов и брендов: от коротких сцен до выразительных рекламных форматов.",
    accent: "ivory",
  },
  {
    number: "06",
    title: "Визуальная концепция",
    text: "Система образов, стилистика и контент-направление, которые делают бренд цельным и узнаваемым.",
    accent: "dark",
  },
];

const process = [
  ["Знакомство", "Уточняю задачу, продукт, аудиторию и формат."],
  ["Концепция", "Собираю визуальное направление и структуру."],
  ["Создание", "Готовлю контент и довожу детали до единого уровня."],
  ["Результат", "Передаю готовые материалы и рекомендации по использованию."],
];

export default function Home() {
  useEffect(() => {
    const root = document.documentElement;
    const onPointerMove = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX / window.innerWidth - 0.5}`);
      root.style.setProperty("--pointer-y", `${event.clientY / window.innerHeight - 0.5}`);
    };
    const onScroll = () => {
      root.style.setProperty("--page-scroll", `${window.scrollY}`);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="На главную">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>Джамиля Шакурова</span>
        </a>
        <nav aria-label="Главная навигация">
          <a href="#services">Услуги</a>
          <a href="#approach">Подход</a>
          <a href="#contact">Контакты</a>
        </nav>
        <a className="header-cta" href="https://diagnostika.shakurova-content.ru">
          Диагностика
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">
            AI-креатор · контент-продюсер · digital-дизайн
          </p>
          <h1>
            Визуал, который
            <span> раскрывает ценность</span>
            вашего продукта
          </h1>
          <p className="hero-lead">
            Создаю нейрофото, видео, презентации и интерактивные
            digital-инструменты для брендов — современно, эстетично и с
            продуманной задачей.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#services">
              Посмотреть услуги
              <span aria-hidden="true">↘</span>
            </a>
            <a
              className="button button-secondary"
              href="https://diagnostika.shakurova-content.ru"
            >
              Пройти диагностику
            </a>
          </div>
        </div>

        <div className="hero-art" aria-label="Абстрактная композиция бренда">
          <div className="orb orb-back" />
          <div className="orb orb-main">
            <span className="orb-label">creative intelligence</span>
            <span className="orb-year">2026</span>
          </div>
          <div className="orbit">
            <i />
            <i />
            <i />
          </div>
          <div className="floating-card card-a">
            <span>Нейровизуал</span>
            <strong>Фото · Видео</strong>
          </div>
          <div className="floating-card card-b">
            <span>Digital</span>
            <strong>Презентации · Квизы</strong>
          </div>
          <div className="flower-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="scroll-note">
          <span>Листайте</span>
          <i />
        </div>
      </section>

      <section className="statement">
        <p>Не просто красивый кадр.</p>
        <h2>
          Визуальная система, которая помогает бренду быть{" "}
          <em>понятным, желанным и узнаваемым.</em>
        </h2>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">Направления работы</p>
          <h2>Всё необходимое для сильной визуальной коммуникации</h2>
          <p>
            От одного кадра до цельной digital-системы — под задачу, аудиторию
            и этап развития проекта.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article
              className={`service-card accent-${service.accent}`}
              key={service.number}
            >
              <span className="service-number">{service.number}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
              <span className="card-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="constructor-section">
        <div className="constructor-window">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <p>Интерактивная диагностика</p>
          </div>
          <div className="window-body">
            <div className="quiz-copy">
              <span className="mini-label">Шаг 03 / 07</span>
              <h3>Что сейчас важнее всего для вашего контента?</h3>
              <p>
                Конструктор адаптирует рекомендации под нишу, продукт и
                текущую задачу бренда.
              </p>
            </div>
            <div className="quiz-options" aria-hidden="true">
              <span className="selected">Повысить ценность продукта</span>
              <span>Собрать единый визуальный стиль</span>
              <span>Регулярно создавать контент</span>
            </div>
          </div>
        </div>
        <div className="constructor-copy">
          <p className="eyebrow">Digital-инструменты</p>
          <h2>Конструкторы, которые работают вместе с контентом</h2>
          <p>
            Интерактивная диагностика, квиз или мини-сервис помогают не только
            привлечь внимание, но и лучше понять запрос клиента, сегментировать
            аудиторию и подготовить точное предложение.
          </p>
          <a
            className="text-link"
            href="https://diagnostika.shakurova-content.ru"
          >
            Открыть готовую диагностику <span>→</span>
          </a>
        </div>
      </section>

      <section className="approach-section" id="approach">
        <div className="section-heading compact">
          <p className="eyebrow">Как строится работа</p>
          <h2>Понятный процесс без лишней сложности</h2>
        </div>
        <div className="process-list">
          {process.map(([title, text], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-orb" aria-hidden="true" />
        <p className="eyebrow">Новый проект</p>
        <h2>Покажем ваш продукт современно и с ощущением ценности?</h2>
        <p>
          Начните с диагностики — она поможет определить сильные стороны,
          задачи и подходящий формат контента.
        </p>
        <a
          className="button button-light"
          href="https://diagnostika.shakurova-content.ru"
        >
          Пройти контент-диагностику <span>↗</span>
        </a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">✦</span>
          <span>Джамиля Шакурова</span>
        </a>
        <p>AI-креатор и контент-продюсер</p>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
