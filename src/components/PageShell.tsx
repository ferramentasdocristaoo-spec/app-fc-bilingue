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
    <div className="flex flex-col px-4 pt-4 pb-8 md:px-8 md:pt-6">
      <div className="flex items-center gap-3 mb-4">
        {isMobile && (
          <Link to="/" className="w-9 h-9 rounded-full bg-card gold-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary" />
          </Link>
        )}
        <h1 className="font-display text-lg md:text-xl font-bold text-primary flex-1">{title}</h1>
        <FontSizeSelector />
      </div>
      <div className={`flex-1 ${fontSizeClass}`}>{children}</div>
    </div>
  );
};

export default PageShell;
