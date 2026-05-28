import { SignalingService } from "./SignalingService";
import { SignalMessage } from "../types/signaling";

interface PeerServiceCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState | "disconnected") => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export class PeerService {
  private pc: RTCPeerConnection;
  private signaling: SignalingService;
  private makingOffer = false;
  private ignoreOffer = false;
  private polite: boolean;
  private callbacks: PeerServiceCallbacks;
  // Buffer ICE candidates that arrive before remoteDescription is set
  private iceCandidateBuffer: RTCIceCandidateInit[] = [];
  private hasRemoteDescription = false;

  constructor(
    signaling: SignalingService,
    polite: boolean,
    callbacks: PeerServiceCallbacks
  ) {
    this.signaling = signaling;
    this.polite = polite;
    this.callbacks = callbacks;

    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.ontrack = ({ streams }) => {
      console.log("[Peer] ontrack fired, streams:", streams.length);
      const stream = streams[0];
      if (stream) {
        this.callbacks.onRemoteStream(stream);
        stream.onaddtrack = () => this.callbacks.onRemoteStream(stream);
      }
    };

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.signaling.send({ type: "ice-candidate", candidate: candidate.toJSON() });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log("[Peer] ICE:", this.pc.iceConnectionState);
    };

    this.pc.onconnectionstatechange = () => {
      console.log("[Peer] Connection:", this.pc.connectionState);
      this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };

    this.signaling.onMessage(async (msg: SignalMessage) => {
      try {
        await this.handleSignal(msg);
      } catch (err) {
        console.error("[Peer] handleSignal error:", err);
      }
    });
  }

  private async handleSignal(msg: SignalMessage) {
    if (msg.type === "offer" || msg.type === "answer") {
      const description = msg.sdp!;

      const offerCollision =
        msg.type === "offer" &&
        (this.makingOffer || this.pc.signalingState !== "stable");

      this.ignoreOffer = !this.polite && offerCollision;
      if (this.ignoreOffer) {
        console.log("[Peer] Ignoring colliding offer (impolite)");
        return;
      }

      await this.pc.setRemoteDescription(new RTCSessionDescription(description));
      this.hasRemoteDescription = true;

      // Flush buffered ICE candidates now that remote desc is set
      for (const c of this.iceCandidateBuffer) {
        await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      this.iceCandidateBuffer = [];

      if (msg.type === "offer") {
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.signaling.send({ type: "answer", sdp: this.pc.localDescription! });
      }

    } else if (msg.type === "ice-candidate" && msg.candidate) {
      if (this.hasRemoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(console.warn);
      } else {
        console.log("[Peer] Buffering ICE candidate");
        this.iceCandidateBuffer.push(msg.candidate);
      }

    } else if (msg.type === "ready") {
      // The other peer is ready — if we are the caller, send the offer now
      // This is the KEY fix: we only create the offer once we KNOW the
      // remote peer has its message handler set up and is listening.
      if (!this.polite) {
        console.log("[Peer] Got ready signal, creating offer as caller");
        await this.createAndSendOffer();
      }

    } else if (msg.type === "bye") {
      this.callbacks.onConnectionStateChange("disconnected");
    }
  }

  addTracks(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      console.log("[Peer] Adding track:", track.kind);
      this.pc.addTrack(track, stream);
    });
  }

  async createAndSendOffer() {
    try {
      this.makingOffer = true;
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.signaling.send({ type: "offer", sdp: this.pc.localDescription! });
      console.log("[Peer] Offer sent");
    } catch (err) {
      console.error("[Peer] createAndSendOffer error:", err);
    } finally {
      this.makingOffer = false;
    }
  }

  sendBye() {
    this.signaling.send({ type: "bye" });
  }

  destroy() {
    this.pc.close();
  }

  get connectionState() {
    return this.pc.connectionState;
  }
}
