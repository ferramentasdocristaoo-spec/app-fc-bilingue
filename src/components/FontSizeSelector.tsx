import { useTranslation } from "react-i18next";
import { useFontSize, FontSizeOption } from "@/hooks/use-font-size";
import { Type } from "lucide-react";

const SIZE_OPTIONS: { value: FontSizeOption; key: keyof { small: string; medium: string; large: string; xlarge: string }; sizeClass: string }[] = [
  { value: "small", key: "small", sizeClass: "text-xs" },
  { value: "medium", key: "medium", sizeClass: "text-sm" },
  { value: "large", key: "large", sizeClass: "text-lg" },
  { value: "xlarge", key: "xlarge", sizeClass: "text-xl" },
];

const FontSizeSelector = () => {
  const { t } = useTranslation();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
      <Type className="w-4 h-4 text-muted-foreground mr-0.5" />
      {SIZE_OPTIONS.map((opt) => {
        const label = t(`fontSize.${opt.key}`);
        return (
          <button
            key={opt.value}
            onClick={() => setFontSize(opt.value)}
            className={`min-w-[32px] px-2 py-1 rounded-md font-semibold transition-colors ${
              fontSize === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
