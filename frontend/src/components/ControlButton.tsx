import { ReactNode } from "react";

interface ControlButtonProps {
  onClick: () => void;
  active?: boolean;           // true = normal state
  danger?: boolean;           // red button (end call)
  tooltip: string;
  children: ReactNode;
  disabled?: boolean;
}

export function ControlButton({
  onClick,
  active = true,
  danger = false,
  tooltip,
  children,
  disabled = false,
}: ControlButtonProps) {
  let bg: string;
  if (danger) {
    bg = "bg-red-600 hover:bg-red-500 shadow-red-900/50";
  } else if (active) {
    bg = "bg-white/10 hover:bg-white/20 border border-white/10";
  } else {
    bg = "bg-red-500/90 hover:bg-red-400 shadow-red-900/50";
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
        className={`
          w-14 h-14 rounded-2xl flex items-center justify-center
          transition-all duration-200 shadow-lg
          active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
          ${bg}
        `}
      >
        {children}
      </button>
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg
                      bg-black/80 text-white text-xs whitespace-nowrap pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150 backdrop-blur-sm">
        {tooltip}
      </div>
    </div>
  );
}
