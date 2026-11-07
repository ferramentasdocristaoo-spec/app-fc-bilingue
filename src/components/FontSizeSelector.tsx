import { useTranslation } from "react-i18next";
import { useFontSize, FontSizeOption } from "@/hooks/use-font-size";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SIZES: { value: FontSizeOption; px: number }[] = [
  { value: "small", px: 14 },
  { value: "medium", px: 17 },
  { value: "large", px: 20 },
  { value: "xlarge", px: 24 },
];

/** "Aa" discreto no topo: o tamanho vale para o app inteiro, não precisa ocupar cada página. */
const FontSizeSelector = () => {
  const { t } = useTranslation();
  const { fontSize, setFontSize } = useFontSize();
  const names = t("fontSize.names", { returnObjects: true }) as string[];

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("fontSize.label")}
        title={t("fontSize.label")}
        className="flex h-11 w-11 items-center justify-center font-display text-xl font-semibold text-ink-2 hover:text-foreground"
      >
        Aa
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-sm p-4">
        <p className="ed-label mb-2" id="font-size-label">{t("fontSize.label")}</p>
        <div className="grid grid-cols-4" role="group" aria-labelledby="font-size-label">
          {SIZES.map((size, index) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              aria-pressed={fontSize === size.value}
              aria-label={names[index]}
              title={names[index]}
              className={`flex h-12 items-center justify-center border-b-2 font-display font-semibold transition-colors ${
                fontSize === size.value ? "border-gold-ink text-foreground" : "border-rule-soft text-ink-3 hover:text-foreground"
              }`}
              style={{ fontSize: size.px }}
            >
              A
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FontSizeSelector;
