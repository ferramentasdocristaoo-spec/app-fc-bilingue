import { useFontSize, FontSizeOption } from "@/hooks/use-font-size";
import { Type } from "lucide-react";

const OPTIONS: { value: FontSizeOption; label: string; sizeClass: string }[] = [
  { value: "small", label: "P", sizeClass: "text-xs" },
  { value: "medium", label: "M", sizeClass: "text-sm" },
  { value: "large", label: "G", sizeClass: "text-lg" },
  { value: "xlarge", label: "SG", sizeClass: "text-xl" },
];

const FontSizeSelector = () => {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
      <Type className="w-4 h-4 text-muted-foreground mr-0.5" />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFontSize(opt.value)}
          className={`min-w-[32px] px-2 py-1 rounded-md font-semibold transition-colors ${
            fontSize === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title={`Tamanho ${opt.label}`}
        >
          <span className={opt.sizeClass}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FontSizeSelector;
