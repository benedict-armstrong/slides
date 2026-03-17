import { forwardRef } from "react";

export const CurrentSlideCard = forwardRef<HTMLDivElement>((_props, ref) => (
  <div ref={ref} className="h-full rounded overflow-hidden bg-white" />
));
