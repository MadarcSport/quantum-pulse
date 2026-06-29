import type { CSSProperties, ReactElement } from "react";

export interface CanvaAppProps {
  style?: CSSProperties;
  canvasStyle?: CSSProperties;
}

export default function CanvaApp(props: CanvaAppProps): ReactElement;
export function CanvaApp(props: CanvaAppProps): ReactElement;
