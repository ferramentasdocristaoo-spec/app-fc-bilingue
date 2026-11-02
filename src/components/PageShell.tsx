import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFontSize } from "@/hooks/use-font-size";
import FontSizeSelector from "@/components/FontSizeSelector";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

const PageShell = ({ title, children }: PageShellProps) => {
  const isMobile = useIsMobile();
  const { fontSizeClass } = useFontSize();

  return (
    <div className="flex flex-col px-5 pt-5 pb-10 md:px-10 md:pt-8">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        {isMobile && (
          <Link to="/" aria-label="←" className="-ml-2 w-10 h-10 flex items-center justify-center text-ink-2 hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <h1 className="font-display text-2xl md:text-[2rem] font-semibold leading-tight text-foreground flex-1">{title}</h1>
        <FontSizeSelector />
      </div>
      <div className={`flex-1 ${fontSizeClass}`}>{children}</div>
    </div>
  );
};

export default PageShell;
