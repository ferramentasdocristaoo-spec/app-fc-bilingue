import { describe, expect, it } from "vitest";
import { cleanBibleText } from "@/lib/bible-text";

describe("cleanBibleText", () => {
  it("removes Strong numbers without removing biblical text", () => {
    expect(cleanBibleText("God<S>430</S> created<S>1254</S> the earth<S>776</S>."))
      .toBe("God created the earth.");
  });

  it("removes footnote markers and preserves formatting content", () => {
    expect(cleanBibleText("Spirit<sup>[1]</sup> of <i>God</i>"))
      .toBe("Spirit of God");
  });

  it("preserves meaningful line breaks and decodes entities", () => {
    expect(cleanBibleText("Light<br/>and&nbsp;darkness"))
      .toBe("Light\nand darkness");
  });

  it("returns text only for unexpected external markup", () => {
    expect(cleanBibleText('<img src=x onerror="alert(1)">Safe text'))
      .toBe("Safe text");
  });

  it("removes Schlachter 2000 footnote references", () => {
    expect(cleanBibleText("Denn so [sehr]<f> [27]</f> hat Gott die Welt geliebt"))
      .toBe("Denn so [sehr] hat Gott die Welt geliebt");
  });

  it("removes loose numeric footnote markers", () => {
    expect(cleanBibleText("Am Anfang schuf Gott[1] Himmel und Erde. [ 2 ]"))
      .toBe("Am Anfang schuf Gott Himmel und Erde.");
  });

  it("keeps bold and italic content as plain text", () => {
    expect(cleanBibleText("<b>Jesus</b> dit: <i>Je suis</i> le chemin[4]."))
      .toBe("Jesus dit: Je suis le chemin.");
  });
});
