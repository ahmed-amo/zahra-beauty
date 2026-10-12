import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    alt = 'Zahra',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/logo-zahra-black.png"
            alt={alt}
            className={className}
            {...props}
        />
    );
}
