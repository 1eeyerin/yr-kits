import { toastStyle } from "./styles";

interface OverlayToastProps {
  message: string | null;
}

export function OverlayToast({ message }: OverlayToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div style={toastStyle}>
      <p aria-live="polite" style={{ margin: 0 }}>
        {message}
      </p>
    </div>
  );
}
