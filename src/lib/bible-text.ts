export function cleanBibleText(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");

  // Bolls uses <S> for Strong numbers. Browsers interpret it as the
  // strikethrough HTML element <s>, which caused crossed-out numbers.
  document.querySelectorAll("s, sup").forEach((element) => element.remove());

  document.querySelectorAll("br").forEach((element) => {
    element.replaceWith(document.createTextNode("\n"));
  });

  document.querySelectorAll("p").forEach((element) => {
    element.before(document.createTextNode("\n"));
    element.after(document.createTextNode("\n"));
  });

  return (document.body.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
