import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export default function Share() {
  const { id } = useParams<{ id: string }>();

  const controllerUrl = `${window.location.origin}/s/${id}?role=controller`;
  const viewerUrl = `${window.location.origin}/s/${id}?role=viewer`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) return;
        const session = await res.json();
        if (!cancelled) document.title = `${session.filename} - Share`;
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; document.title = "Slide Controller"; };
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <QRCodeSVG
                value={`${window.location.origin}/s/${id}?role=viewer`}
                size={180}
                className="rounded"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Session Code</p>
              <p className="text-5xl font-bold tracking-widest font-mono select-all">
                {id}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this code or scan the QR to join as a viewer
            </p>
          </div>

          <div className="space-y-3">
            <CopyRow label="Controller link" url={controllerUrl} />
            <CopyRow label="Viewer link" url={viewerUrl} />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" asChild>
              <Link to={`/s/${id}?role=controller`}>Open as Controller</Link>
            </Button>
            <Button className="flex-1" variant="outline" asChild>
              <Link to={`/s/${id}?role=viewer`}>Open as Viewer</Link>
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 text-xs bg-muted rounded px-3 py-2 overflow-x-auto select-all">
          {url}
        </code>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
