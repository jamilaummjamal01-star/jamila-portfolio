import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata without exposing constructor navigation", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.doesNotMatch(
    html,
    /constructor\.shakurova-content\.ru/i,
  );
  assert.doesNotMatch(html, /Войти в конструктор/);
});

test("renders the protected constructor navigation locally", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("constructor-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/constructor", {
      headers: { accept: "text/html" },
    }),
    {
      CONSTRUCTOR_DEV_BYPASS: "true",
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /frame-ancestors 'none'/,
  );
  const html = await response.text();
  assert.match(html, /Главная/);
  assert.match(html, /Рабочая ситуация/);
  assert.match(html, /Следующие контакты/);
  assert.match(html, /План контактов/);
  assert.match(html, /Подготовиться к клиенту/);
  assert.match(html, /Клиент задал вопрос/);
  assert.match(html, /Диагностика/);
  assert.match(html, /Клиенты/);
  assert.match(html, /Избранное и история/);
  assert.match(html, /Калькулятор/);
  assert.match(html, /Коммерческие предложения/);
  assert.match(html, /Импорт и качество/);
});

test("turns a complete inbound client message into one structured response", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("answer-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const answerRow = {
    id: "answer-price",
    item_type: "question_from_client",
    category: "price",
    title: "Как формируется стоимость",
    prompt_text: "Как Вы работаете и сколько это стоит?",
    short_text: "Сначала уточняю задачу и объём, затем предлагаю варианты.",
    full_text: "Стоимость зависит от задачи, исходников и состава материалов.",
    soft_text: null,
    firm_text: null,
    clarification_text: "Какой бюджет Вы рассматриваете?",
    next_action_text: "Уточнить задачу и подготовить два варианта.",
    avoid_text: "Не называть неподтверждённую сумму.",
    red_flag_text: null,
    risk_level: "normal",
    channel: "any",
    niche_names: "Парфюмерия, косметика и уходовые товары",
  };
  const questionRows = [
    ["goal", "Цель запуска", "Какой главный результат должен дать контент к запуску?"],
    ["channels", "Площадки", "На каких площадках планируется использовать материалы?"],
    ["sources", "Исходники", "Какие фотографии продукта и упаковки уже есть?"],
    ["timeline", "Срок", "К какой точной дате материалы должны быть готовы?"],
    ["budget", "Бюджет", "Какой бюджет или диапазон Вы рассматриваете?"],
    ["claims", "Свойства", "Какие свойства продукта подтверждены составом и маркировкой?"],
  ].map(([category, title, promptText], index) => ({
    id: `question-${index + 1}`,
    category,
    title,
    prompt_text: promptText,
    required_level: "required",
  }));

  const database = {
    prepare(sql) {
      return {
        sql,
        params: [],
        bind(...params) {
          this.params = params;
          return this;
        },
      };
    },
    async batch(statements) {
      return statements.map((statement) => {
        if (statement.sql.includes("question_from_client")) return { results: [answerRow], success: true };
        if (statement.sql.includes("question_to_client")) return { results: questionRows, success: true };
        if (statement.sql.includes("FROM niches")) {
          return { results: [{ slug: "perfume-cosmetics-care", name: "Парфюмерия, косметика и уходовые товары" }], success: true };
        }
        if (statement.sql.includes("FROM pricing_tariffs")) return { results: [{ tariff_count: 0 }], success: true };
        return { results: [], success: true };
      });
    },
  };

  const response = await worker.fetch(
    new Request("http://localhost/api/constructor/answers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: "Я — Амина, владелица LUNEVA Skin. Ассаляму алейкум. У нас бренд уходовой косметики. Через месяц запускаем новую сыворотку. Не понимаю, нужны фото, ролики или что-то другое. Как Вы работаете и сколько это стоит?",
        niche: "",
        channel: "instagram",
      }),
    }),
    { CONSTRUCTOR_DEV_BYPASS: "true", DB: database },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.analysis.contactName, "Амина");
  assert.equal(payload.analysis.brandName, "LUNEVA Skin");
  assert.equal(payload.analysis.nicheSlug, "perfume-cosmetics-care");
  assert.equal(payload.analysis.product, "новая сыворотка");
  assert.equal(payload.analysis.launchTiming.toLocaleLowerCase("ru"), "через месяц");
  assert.deepEqual(payload.analysis.intents, ["launch", "format", "process", "price"]);
  assert.match(payload.draft.readyText, /Ва алейкум ассалям, Амина!/);
  assert.equal(payload.draft.clarifyingQuestions.length, 6);
  assert.equal(payload.draft.pricing.configured, false);
  assert.doesNotMatch(payload.draft.readyText, /₽|руб(?:лей|ля)?/i);
});
