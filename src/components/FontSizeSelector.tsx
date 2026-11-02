import { useTranslation } from "react-i18next";
import { useFontSize, FontSizeOption } from "@/hooks/use-font-size";
import { Type } from "lucide-react";

const SIZE_OPTIONS: { value: FontSizeOption; key: keyof { small: string; medium: string; large: string; xlarge: string }; sizeClass: string }[] = [
  { value: "small", key: "small", sizeClass: "text-xs" },
  { value: "medium", key: "medium", sizeClass: "text-sm" },
  { value: "large", key: "large", sizeClass: "text-base" },
  { value: "xlarge", key: "xlarge", sizeClass: "text-lg" },
];

const FontSizeSelector = () => {
  const { t } = useTranslation();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Aa">
      <Type className="w-4 h-4 text-ink-3 mr-1" aria-hidden />
      {SIZE_OPTIONS.map((opt) => {
        const label = t(`fontSize.${opt.key}`);
        return (
          <button
            key={opt.value}
            onClick={() => setFontSize(opt.value)}
            aria-pressed={fontSize === opt.value}
            className={`min-w-[30px] h-8 px-1.5 font-body font-medium border-b-2 transition-colors ${
              fontSize === opt.value
                ? "border-gold text-foreground"
                : "border-transparent text-ink-3 hover:text-foreground"
            }`}
          >
            <span className={opt.sizeClass}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FontSizeSelector;
