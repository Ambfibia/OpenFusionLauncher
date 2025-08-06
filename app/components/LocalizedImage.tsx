import { useEffect, useState } from "react";
import { useLanguage } from "@/app/i18n";

interface LocalizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export default function LocalizedImage({ src, ...props }: LocalizedImageProps) {
  const { lang } = useLanguage();
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    const dotIndex = src.lastIndexOf(".");
    const localizedSrc =
      dotIndex >= 0
        ? `${src.slice(0, dotIndex)}-${lang}${src.slice(dotIndex)}`
        : `${src}-${lang}`;
    setCurrentSrc(src);
    const img = new Image();
    img.onload = () => setCurrentSrc(localizedSrc);
    img.onerror = () => setCurrentSrc(src);
    img.src = localizedSrc;
  }, [lang, src]);

  return <img src={currentSrc} {...props} />;
}
