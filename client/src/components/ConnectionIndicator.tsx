import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export function ConnectionIndicator({ dark = false }: { dark?: boolean }) {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <span
      className="relative flex h-2.5 w-2.5"
      title={connected ? "Connected" : "Disconnected"}
    >
      {connected && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          connected
            ? "bg-green-500"
            : dark ? "bg-red-400" : "bg-red-500"
        }`}
      />
    </span>
  );
}
