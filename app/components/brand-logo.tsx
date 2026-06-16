import Image from "next/image";
import logoQuantum from "../../logoqauntum03.png";

type BrandLogoProps = {
  size?: number;
  mobileSize?: number;
};

export function BrandLogo({ size = 30, mobileSize }: BrandLogoProps) {
  return (
    <Image
      src={logoQuantum}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="brand-logo"
      style={{
        display: "block",
        objectFit: "contain",
        width: "var(--brand-logo-size)",
        height: "var(--brand-logo-size)",
        ["--brand-logo-size" as string]: `${size}px`,
        ["--brand-logo-mobile-size" as string]: `${mobileSize ?? size}px`,
      }}
    />
  );
}
