import Image from "next/image";
import logoQuantum from "../../logoqauntum03.png";

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 30 }: BrandLogoProps) {
  return (
    <Image
      src={logoQuantum}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}
