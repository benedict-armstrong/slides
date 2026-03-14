import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RecentSession {
  id: string;
  filename: string;
  hasToken: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    const sessionKeys = Object.keys(localStorage).filter((k) => k.startsWith("session_"));
    if (!sessionKeys.length) return;

    let cancelled = false;
    Promise.all(
      sessionKeys.map(async (key) => {
        const id = key.replace("session_", "");
        try {
          const res = await fetch(`/api/sessions/${id}`);
          if (!res.ok) {
            localStorage.removeItem(key);
            return null;
          }
          const session = await res.json();
          const stored = JSON.parse(localStorage.getItem(key) || "{}");
          return { id, filename: session.filename, hasToken: !!stored.controllerToken } as RecentSession;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!cancelled) setRecentSessions(results.filter((r): r is RecentSession => r !== null));
    });

    return () => { cancelled = true; };
  }, []);

  const upload = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("pdf", file);
      const res = await fetch("/api/sessions", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Upload failed");
      }
      const { id, controllerToken, passphrase } = await res.json();
      localStorage.setItem(`session_${id}`, JSON.stringify({ controllerToken, passphrase }));
      navigate(`/s/${id}/share`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [navigate]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") upload(file);
      else setError("Please drop a PDF file");
    },
    [upload]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload]
  );

  const joinSession = (role: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    navigate(`/s/${trimmed}?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Slide Controller</h1>
            <p className="text-sm text-muted-foreground">
              Upload a PDF presentation to start presenting
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <p className="text-muted-foreground text-sm">
              {uploading ? "Uploading..." : "Drop a PDF here or click to browse"}
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={onFileSelect}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or join existing</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter session code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={10}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter") joinSession("viewer");
              }}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                disabled={!code.trim()}
                onClick={() => joinSession("viewer")}
              >
                Join as Viewer
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                disabled={!code.trim()}
                onClick={() => joinSession("controller")}
              >
                Join as Controller
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {recentSessions.length > 0 && (
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent presentations
            </p>
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.filename}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.id}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {s.hasToken && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/s/${s.id}?role=controller`)}>
                      Control
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/s/${s.id}?role=viewer`)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Link
        to="/about"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        How does this work?
      </Link>
    </div>
  );
}
