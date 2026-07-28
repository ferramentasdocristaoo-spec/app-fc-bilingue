export function cleanBibleText(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");

  // Bolls uses <S> for Strong numbers (browsers read it as strikethrough <s>),
  // <sup> for footnote markers and <f> for footnote references (e.g. Schlachter 2000).
  document.querySelectorAll("s, sup, f").forEach((element) => element.remove());

  document.querySelectorAll("br").forEach((element) => {
    element.replaceWith(document.createTextNode("\n"));
  });

  document.querySelectorAll("p").forEach((element) => {
    element.before(document.createTextNode("\n"));
    element.after(document.createTextNode("\n"));
  });

  return (document.body.textContent ?? "")
    .replace(/\u00a0/g, " ")
    // Marcadores numéricos de nota de rodapé que vêm soltos no texto: [17], [ 27 ]
    .replace(/\[\s*\d+\s*\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?»”])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
