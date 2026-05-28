import { ConnectionStatus } from "../hooks/useVideoCall";

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string; pulse: boolean }
> = {
  idle: { label: "Initializing", color: "#6b7280", pulse: false },
  connecting: { label: "Connecting…", color: "#f59e0b", pulse: true },
  waiting: { label: "Waiting for peer…", color: "#3b82f6", pulse: true },
  connected: { label: "Live", color: "#22c55e", pulse: true },
  disconnected: { label: "Disconnected", color: "#ef4444", pulse: false },
  error: { label: "Error", color: "#ef4444", pulse: false },
};

interface StatusBadgeProps {
  status: ConnectionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: cfg.color,
          boxShadow: cfg.pulse ? `0 0 8px ${cfg.color}` : "none",
          animation: cfg.pulse ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      />
      <span className="text-xs font-medium tracking-wide" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}
