import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [1280, 1440, 1536, 2560]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(`
      <div class="ed-page ed-page-wide"></div>
      <div class="ed-page ed-page-tool">
        <header class="ed-page-head"></header><div></div>
        <article class="ed-result"><section class="ed-result-section">
          <p>Texto corrido</p><p class="ed-result-text">Resposta corrida</p>
          <div class="ed-result-item"><p>Trecho da resposta</p></div>
        </section></article>
      </div>
      <div class="trilha"><div class="trilha-stages"><ol></ol></div><div class="trilha-body"></div></div>
      <div class="oficina-trilha">
        <div class="studio-shell"><aside class="studio-outline"></aside><div class="studio-document"></div></div>
        <div class="studio-shell"><aside class="studio-outline"></aside><div class="studio-editor"></div></div>
      </div>
      <div class="jornada-trilha"><div class="jornada-map-card"></div><div class="journey-home"></div></div>
      <div class="biblia-container"><div class="estante-prateleira"><div class="estante-livro"><span class="estante-livro-nome">Lamentações de Jeremias</span></div></div><div class="biblia-reading-view"><div class="biblia-verses-container"></div></div></div>
      <div class="journey-book-content"></div>
      <div class="chapter-journey-page"><div class="chapter-journey-steps"></div></div>
    `);
    await page.addStyleTag({ content: "*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }" });
    for (const path of [
      "src/styles/editorial.css", "src/pages/HomeTrilha.css", "src/pages/OficinaTrilha.css", "src/pages/WorkspaceDesign.css",
      "src/pages/JornadaTrilha.css", "src/pages/JourneyDesign.css", "src/pages/BibliaDesign.css",
      "src/components/journey/JourneyInteractive.css",
    ]) await page.addStyleTag({ path });
    const values = await page.evaluate(() => {
      const el = (selector) => document.querySelector(selector);
      const width = (selector) => el(selector).getBoundingClientRect().width;
      const available = (selector) => {
        const parent = el(selector).parentElement;
        const style = getComputedStyle(parent);
        return parent.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      };
      return {
        widths: Object.fromEntries([".ed-page-wide", ".ed-page-tool", ".trilha-body", ".oficina-trilha", ".jornada-trilha", ".biblia-container", ".journey-book-content", ".chapter-journey-page"].map((selector) => [selector, width(selector)])),
        nested: Object.fromEntries([".trilha-stages ol", ".journey-home", ".biblia-reading-view", ".chapter-journey-steps"].map((selector) => [selector, [width(selector), available(selector)]])),
        mapHeight: el(".jornada-map-card").getBoundingClientRect().height,
        verseFont: getComputedStyle(el(".biblia-verses-container")).fontSize,
        bookWidth: width(".estante-livro"),
        bookScrollWidth: el(".estante-livro").scrollWidth,
        studioWidths: [".studio-document", ".studio-editor"].map((selector) => {
          const shell = el(selector).parentElement;
          const columns = getComputedStyle(shell).gridTemplateColumns.split(" ").map(parseFloat);
          return [width(selector), columns[1]];
        }),
        resultWidth: width(".ed-page-tool > .ed-result"),
        resultAvailable: parseFloat(getComputedStyle(el(".ed-page-tool")).gridTemplateColumns.split(" ")[1]),
        proseWidths: [".ed-result-section > p", ".ed-result-text", ".ed-result-item p"].map(width),
      };
    });
    for (const [selector, actual] of Object.entries(values.widths)) {
      assert.ok(actual >= width - 2, `${selector}: ${actual}px em viewport de ${width}px`);
    }
    for (const [selector, [actual, available]] of Object.entries(values.nested)) {
      assert.ok(actual >= available - 2, `${selector}: ${actual}px disponíveis ${available}px`);
    }
    assert.equal(values.mapHeight, width >= 1600 ? 480 : 440);
    assert.equal(values.verseFont, "20px");
    assert.ok(values.bookWidth >= 140, `capa estreita: ${values.bookWidth}px`);
    assert.ok(values.bookScrollWidth <= values.bookWidth + 1, "nome do livro transborda da capa");
    for (const [actual, available] of values.studioWidths) {
      assert.ok(actual >= available - 2, `estúdio: ${actual}px disponíveis ${available}px`);
    }
    assert.ok(values.resultWidth >= values.resultAvailable - 2, `painel de resposta estreito: ${values.resultWidth}px`);
    for (const actual of values.proseWidths) {
      assert.ok(actual <= 800, `prosa larga demais: ${actual}px`);
    }
    await page.close();
  }
  console.log("Desktop 1280/1440/1536/2560: largura, prosa, mapa, versículos e estante OK");
} finally {
  await browser.close();
}
