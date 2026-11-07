interface PageShellProps {
  title: string;
  /** Frase de abertura logo abaixo do título. */
  lede?: string;
  /** "read": coluna de leitura. "wide": bibliotecas e estúdio. */
  width?: "read" | "wide";
  children: React.ReactNode;
}

/** Abertura igual em todas as telas: título, linha-fina e filete; o conteúdo começa na mesma margem do título. */
const PageShell = ({ title, lede, width = "read", children }: PageShellProps) => (
  <div className={`ed-page ed-page-${width}`}>
    <header className="ed-page-head">
      <h1>{title}</h1>
      {lede && <p className="ed-lede">{lede}</p>}
    </header>
    {children}
  </div>
);

export default PageShell;
