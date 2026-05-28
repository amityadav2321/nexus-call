import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingService } from "../services/SignalingService";
import { PeerService } from "../services/PeerService";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "waiting";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

// #caller tab = impolite peer (creates offer)
// no hash    = polite peer (sends "ready", waits for offer)clear

const isCaller = window.location.hash === "#caller";

export function useVideoCall() {
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [micOn,    setMicOn]    = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [callEnded,  setCallEnded]  = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const signalingRef = useRef<SignalingService | null>(null);
  const peerRef      = useRef<PeerService | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  // Save the remote stream so we can re-attach if the video element remounts
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // ── Attach helpers ────────────────────────────────────────────────────────
  const attachLocalVideo = useCallback((stream: MediaStream) => {
    const v = localVideoRef.current;
    if (v && v.srcObject !== stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    console.log("[Hook] attachRemoteStream, tracks:", stream.getTracks().length);
    remoteStreamRef.current = stream;
    const v = remoteVideoRef.current;
    if (!v) { console.warn("[Hook] remoteVideoRef not ready yet"); return; }
    if (v.srcObject === stream) return;
    v.srcObject = stream;
    v.play().catch((e) => console.warn("[Hook] remote play():", e));
  }, []);

  const handleConnectionStateChange = useCallback(
    (state: RTCPeerConnectionState | "disconnected") => {
      if      (state === "connected")   setConnectionStatus("connected");
      else if (state === "connecting" || state === "new") setConnectionStatus("connecting");
      else if (state === "disconnected" || state === "failed" || state === "closed")
        setConnectionStatus("disconnected");
    }, []
  );

  // ── Main effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (callEnded) return;
    let cancelled = false;

    const init = async () => {
      setConnectionStatus("idle");

      // 1. Get camera + mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("[Hook] Media OK:", stream.getTracks().map((t) => t.kind));
      } catch (err) {
        if (cancelled) return;
        setMediaError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera/microphone permission denied. Please allow access and reload."
            : "Could not access camera or microphone."
        );
        setConnectionStatus("error");
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      attachLocalVideo(stream);          // show local preview immediately

      // 2. Create signaling service
      const signaling = new SignalingService(WS_URL);
      signalingRef.current = signaling;

      // 3. Create peer (polite = NOT caller, i.e. the receiver)
      const peer = new PeerService(signaling, !isCaller, {
        onRemoteStream: attachRemoteStream,
        onConnectionStateChange: handleConnectionStateChange,
      });
      peerRef.current = peer;
      peer.addTracks(stream);            // must be added before offer is created

      // 4. React to socket open
      signaling.onStatus((open) => {
        console.log("[Hook] Socket open:", open);
        if (open) {
          setConnectionStatus("waiting");
          if (!isCaller) {
            // Receiver tells caller "I'm ready — send your offer"
            console.log("[Hook] Receiver: sending ready signal");
            signaling.send({ type: "ready" });
          }
          // Caller waits for "ready" from receiver (handled in PeerService)
        } else {
          setConnectionStatus("disconnected");
        }
      });

      // 5. Connect WebSocket
      signaling.connect();
    };

    init();

    return () => {
      cancelled = true;
      peerRef.current?.destroy();
      signalingRef.current?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current = null;
      signalingRef.current = null;
      streamRef.current = null;
    };
  }, [callEnded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ref callbacks (handle React remounting video elements) ───────────────
  const localVideoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el && streamRef.current) attachLocalVideo(streamRef.current);
  }, [attachLocalVideo]);

  const remoteVideoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    (remoteVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    // Re-attach already-received remote stream if element remounts
    if (el && remoteStreamRef.current) attachRemoteStream(remoteStreamRef.current);
  }, [attachRemoteStream]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setMicOn(t.enabled);
    });
  }, []);

  const toggleCamera = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setCameraOn(t.enabled);
    });
  }, []);

  const endCall = useCallback(() => {
    peerRef.current?.sendBye();
    peerRef.current?.destroy();
    signalingRef.current?.destroy();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallEnded(true);
    setConnectionStatus("disconnected");
  }, []);

  return {
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
  };
}
