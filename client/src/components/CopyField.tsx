import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-1.5 items-center">
        <code className="flex-1 text-xs bg-muted rounded px-2 py-2.5 overflow-x-auto select-all truncate">
          {value}
        </code>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        {/* Only show if the value is a valid url and not a local file */}
        {value.startsWith("http") && !value.startsWith("file://") && (

        <Button
          variant="outline"
          onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
            <path d="M21 3 12 12" />
            <path d="M15 3h6v6" />
          </svg>
        </Button>
        )}
      </div>
    </div>
  );
}
