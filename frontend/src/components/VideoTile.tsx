import { RefCallback } from "react";

interface VideoTileProps {
  videoRef: RefCallback<HTMLVideoElement>;
  label: string;
  muted?: boolean;
  small?: boolean;
  cameraOff?: boolean;
  initials?: string;
}

export function VideoTile({
  videoRef,
  label,
  muted = false,
  small = false,
  cameraOff = false,
  initials = "?",
}: VideoTileProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#0d1117] border border-white/5 shadow-2xl flex-shrink-0
        ${small ? "w-[280px] h-[158px] lg:w-[320px] lg:h-[180px]" : "flex-1 min-h-0"}`}
      style={{ boxShadow: small ? undefined : "0 8px 64px rgba(0,0,0,0.6)" }}
    >
      {/* Avatar placeholder shown when camera is off */}
      {cameraOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#0d1117]">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold text-white/70">
            {initials}
          </div>
          <span className="text-white/40 text-sm">Camera off</span>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${cameraOff ? "opacity-0" : "opacity-100"}`}
      />

      <div className="absolute bottom-3 left-3">
        <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium tracking-wide border border-white/10">
          {label}
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}
