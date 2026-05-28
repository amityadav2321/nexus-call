interface MicWaveProps {
  active: boolean;
}

const BARS = [
  { delay: "0ms", heights: ["14px", "3px"] },
  { delay: "80ms", heights: ["22px", "3px"] },
  { delay: "160ms", heights: ["30px", "3px"] },
  { delay: "240ms", heights: ["18px", "3px"] },
  { delay: "120ms", heights: ["26px", "3px"] },
];

export function MicWave({ active }: MicWaveProps) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {BARS.map((bar, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            height: active ? bar.heights[0] : bar.heights[1],
            background: active
              ? "linear-gradient(to top, #22c55e, #86efac)"
              : "#374151",
            animation: active ? `pulse 1.2s ease-in-out infinite` : "none",
            animationDelay: bar.delay,
            opacity: active ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}
