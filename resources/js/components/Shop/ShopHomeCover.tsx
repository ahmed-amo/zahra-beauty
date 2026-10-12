import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/mediaUrl";

export type HomeCover = {
  image_url: string;
};

export default function ShopHomeCover({ cover }: { cover: HomeCover | null | undefined }) {
  const { t } = useI18n();
  const src = mediaUrl(cover?.image_url, null);

  if (!src) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <img
        src={src}
        alt={t("Homepage cover")}
        className="aspect-[21/9] max-h-[min(70vh,520px)] min-h-[12rem] w-full object-cover sm:min-h-[16rem] md:aspect-[2.4/1]"
        fetchPriority="high"
      />
    </div>
  );
}
