import { QRCodeSVG } from "qrcode.react";

export function SessionQRCode({
  sessionId,
  size = 200,
}: {
  sessionId: string;
  size?: number;
}) {
  const viewerUrl = `${window.location.origin}/s/${sessionId}?role=viewer`;
  return (
    <div className="text-center space-y-3">
      <p className="text-xs text-muted-foreground">Scan to join as viewer</p>
      <div className="flex justify-center">
        <QRCodeSVG value={viewerUrl} size={size} className="rounded" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">Session Code</p>
        <p className="text-2xl font-bold tracking-widest font-mono select-all">
          {sessionId}
        </p>
      </div>
    </div>
  );
}
