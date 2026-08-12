import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
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
  assert.match(
    html,
    /href=["']https:\/\/constructor\.shakurova-content\.ru\/constructor["']/i,
  );
  assert.match(html, /Войти в конструктор/);
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
  const html = await response.text();
  assert.match(html, /Главная/);
  assert.match(html, /Рабочая ситуация/);
  assert.match(html, /Следующие контакты/);
  assert.match(html, /Подготовиться к клиенту/);
  assert.match(html, /Клиент задал вопрос/);
  assert.match(html, /Диагностика/);
  assert.match(html, /Клиенты/);
  assert.match(html, /Калькулятор/);
  assert.match(html, /Коммерческие предложения/);
  assert.match(html, /Импорт и качество/);
});
