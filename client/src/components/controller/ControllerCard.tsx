import type { ReactNode } from "react";

export function ControllerCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-background border rounded-lg overflow-hidden relative group h-full">
      <div className="card-drag-handle absolute top-0 left-0 right-0 h-6 cursor-move z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-1 rounded-full bg-border" />
      </div>
      <div className="h-full flex flex-col p-3 pt-7">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <p className="text-xs text-muted-foreground font-semibold">{title}</p>
          {action}
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
