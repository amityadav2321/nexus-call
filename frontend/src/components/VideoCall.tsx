import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useVideoCall } from "../hooks/useVideoCall";
import { MicWave } from "./MicWave";
import { StatusBadge } from "./StatusBadge";
import { ControlButton } from "./ControlButton";
import { VideoTile } from "./VideoTile";

export function VideoCall() {
  const {
    localVideoRefCallback,
    remoteVideoRefCallback,
    connectionStatus,
    micOn,
    cameraOn,
    callEnded,
    mediaError,
    toggleMic,
    toggleCamera,
    endCall,
  } = useVideoCall();

  // ── Call ended ────────────────────────────────────────────────────────────
  if (callEnded) {
    return (
      <div className="h-screen bg-[#080c12] flex flex-col items-center justify-center gap-6 text-white">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <PhoneOff size={36} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Call ended</h2>
        <p className="text-white/40 text-sm">You left the call</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
        >
          Rejoin
        </button>
      </div>
    );
  }

  // ── Media error ───────────────────────────────────────────────────────────
  if (mediaError) {
    return (
      <div className="h-screen bg-[#080c12] flex flex-col items-center justify-center gap-4 text-white px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <VideoOff size={28} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold">Media Access Error</h2>
        <p className="text-white/50 text-sm max-w-xs">{mediaError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen bg-[#080c12] text-white flex flex-col select-none overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b border-white/5 bg-[#080c12]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-violet-900/40">
          <img
            src="/callnix.png"
            alt="Callnix"
            className="w-full h-full object-cover"
          />
        </div>
          <span className="font-semibold tracking-tight text-white/90">Callnix - Connect Instantly</span>
        </div>
        <StatusBadge status={connectionStatus} />
      </header>

      {/* Video area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3 relative">
        {/* Remote (large) */}
        <VideoTile
          videoRef={remoteVideoRefCallback}
          label="Remote"
          initials="R"
        />

        {/* Local (PiP bottom-right on mobile, sidebar on desktop) */}
        <div className="absolute bottom-4 right-4 lg:static lg:flex-shrink-0 z-20">
          <VideoTile
            videoRef={localVideoRefCallback}
            label="You"
            muted
            small
            cameraOff={!cameraOn}
            initials="Y"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 h-24 flex items-center justify-center border-t border-white/5 bg-[#0d1117]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block mr-2">
            <MicWave active={micOn} />
          </div>

          <ControlButton active={micOn} onClick={toggleMic} tooltip={micOn ? "Mute" : "Unmute"}>
            {micOn ? <Mic size={22} className="text-white" /> : <MicOff size={22} className="text-white" />}
          </ControlButton>

          <ControlButton active={cameraOn} onClick={toggleCamera} tooltip={cameraOn ? "Stop video" : "Start video"}>
            {cameraOn ? <Video size={22} className="text-white" /> : <VideoOff size={22} className="text-white" />}
          </ControlButton>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <ControlButton danger onClick={endCall} tooltip="End call">
            <PhoneOff size={22} className="text-white" />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
