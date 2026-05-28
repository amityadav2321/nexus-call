import { SignalMessage } from "../types/signaling";

type MessageHandler = (msg: SignalMessage) => void;
type StatusHandler = (open: boolean) => void;

export class SignalingService {
  private ws: WebSocket | null = null;
  private queue: SignalMessage[] = [];
  private messageHandler: MessageHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[Signaling] Connected");
      this.statusHandler?.(true);
      // Flush queued messages
      const pending = [...this.queue];
      this.queue = [];
      pending.forEach((msg) => this.ws!.send(JSON.stringify(msg)));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: SignalMessage = JSON.parse(event.data);
        console.log("[Signaling] RX:", msg.type);
        this.messageHandler?.(msg);
      } catch {
        console.error("[Signaling] Failed to parse:", event.data);
      }
    };

    this.ws.onclose = () => {
      console.log("[Signaling] Disconnected");
      this.statusHandler?.(false);
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      }
    };

    this.ws.onerror = (err) => {
      console.error("[Signaling] Error", err);
    };
  }

  send(msg: SignalMessage) {
    console.log("[Signaling] TX:", msg.type);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  onStatus(handler: StatusHandler) {
    this.statusHandler = handler;
  }

  destroy() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
