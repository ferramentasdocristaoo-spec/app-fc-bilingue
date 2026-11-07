/** Para onde a seta do topo volta no celular: sempre o nível acima, nunca o histórico do navegador. */
export function parentPath(pathname: string): string | null {
  if (pathname === "/" || pathname === "") return null;
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts[0] === "jornada") {
    if (parts[3] === "capitulos") return `/jornada/${parts[1]}/${parts[2]}`;
    if (parts.length > 1) return "/jornada";
    return "/";
  }
  if (parts[0] === "livraria" && parts.length > 1) return `/${parts.slice(0, -1).join("/")}`;
  return "/";
}
