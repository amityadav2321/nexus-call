export type SignalType =
  | "offer"
  | "answer"
  | "ice-candidate"
  | "ready"
  | "bye"
  | "error";

export interface SignalMessage {
  type: SignalType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  message?: string;
}
