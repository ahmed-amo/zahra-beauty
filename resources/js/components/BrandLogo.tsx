import { useAppearance } from "@/hooks/use-appearance";

type Tone = "auto" | "on-dark" | "on-light";

/** Gold calligraphy on dark surfaces, black calligraphy on light ones. */
export default function BrandLogo({
  className = "",
  tone = "auto",
}: {
  className?: string;
  tone?: Tone;
}) {
  const { isDark } = useAppearance();
  const gold = tone === "on-dark" || (tone === "auto" && isDark);

  return (
    <img
      src={gold ? "/logo-zahra-gold.png" : "/logo-zahra-black.png"}
      alt="Zahra"
      className={className}
      width={280}
      height={140}
      decoding="async"
    />
  );
}
