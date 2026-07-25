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
});
