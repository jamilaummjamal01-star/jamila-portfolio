import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  return response.text();
}

test("Worker renders the business card, SEO metadata, stylesheet and all page destinations", async () => {
  const html = await renderHome();
  assert.match(html, /<html[^>]*lang="ru"/);
  assert.match(html, /<title>Джамиля Шакурова — ИИ-креативный продюсер/);
  assert.match(html, /<meta[^>]*name="description"/);
  assert.match(html, /<link[^>]*rel="stylesheet"/);
  assert.doesNotMatch(html, /name="codex-preview"/);
  for (const id of ["top", "services", "products", "projects", "approach", "about", "contact"]) assert.ok(html.includes(`id="${id}"`), id);
  assert.match(html, /https:\/\/diagnostika\.shakurova-content\.ru/);
  assert.match(html, /https:\/\/t\.me\/jamilashakurovaai/);
  assert.match(html, /mailto:jamila\.shakurova@gmail\.com/);
});

test("public product content keeps strategy private and diagnostics unified", async () => {
  const html = await renderHome();
  const products = html.split('id="products"')[1].split('id="projects"')[0];
  assert.equal((products.match(/<article\b/g) ?? []).length, 3);
  const strategy = products.split("product-private")[1].split("</article>")[0];
  assert.match(strategy, /ЗАКРЫТЫЙ ДОСТУП/);
  assert.match(strategy, /Доступ по запросу/);
  assert.doesNotMatch(strategy, /<p\b/);
  assert.doesNotMatch(html, /github\.com\/[^" ]+\/pocket-designer|API_KEY|SECRET_KEY/i);
});

test("every published local image exists and no temporary Figma asset URL ships", async () => {
  const html = await renderHome();
  const images = [...html.matchAll(/src="(\/images\/[^"?]+)"/g)].map((match) => match[1]);
  assert.ok(images.length >= 10);
  for (const source of images) await access(new URL(`../public${source}`, import.meta.url));
  assert.doesNotMatch(html, /figma\.com\/api\/mcp\/asset/);
  const png = await readFile(new URL("../public/images/ranunculus.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png[25], 6, "botanical PNG must retain RGBA transparency");
});
