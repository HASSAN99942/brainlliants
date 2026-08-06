import { WS_BASE } from '../constants/api';
import { tokenStore } from '../storage/secureStore';

export interface ChatMessagePayload {
  id: string;
  body: string;
  sender_id: string;
  sender_name: string;
  is_teacher: boolean;
  created_at: string;
}

/** Close codes the Django consumer uses to refuse a connection outright. */
const CLOSE_UNAUTHENTICATED = 4001;
const CLOSE_NOT_MEMBER = 4003;

export type SocketError = 'unauthenticated' | 'not_member' | null;

/**
 * Group chat socket.
 *
 * React Native ships a global `WebSocket`, so no library is needed. Channels
 * cannot read Authorization headers during the handshake, so the JWT rides in
 * the query string (see apps/community/middleware.py).
 *
 * The consumer closes with 4001 (anonymous) or 4003 (not a group member). Those
 * are permanent conditions, so reconnecting would just hammer the server — the
 * socket reports them via `onError` and stays down instead.
 */
export class GroupSocket {
  private ws: WebSocket | null = null;
  private groupId: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  onMessage?: (msg: ChatMessagePayload) => void;
  onStatus?: (connected: boolean) => void;
  onError?: (reason: SocketError) => void;

  constructor(groupId: string) {
    this.groupId = groupId;
  }

  /**
   * WS_BASE may or may not already carry the `/ws` prefix (the .env default
   * does; the Flutter app's constant does not), so normalise it — otherwise the
   * URL becomes /ws/ws/chat/ and Channels 404s the handshake.
   */
  private url(token: string): string {
    const origin = WS_BASE.replace(/\/+$/, '').replace(/\/ws$/, '');
    return `${origin}/ws/chat/${this.groupId}/?token=${encodeURIComponent(token)}`;
  }

  async connect() {
    this.manuallyClosed = false;
    const token = await tokenStore.getAccess();
    if (!token) { this.onError?.('unauthenticated'); return; }

    this.ws = new WebSocket(this.url(token));

    this.ws.onopen = () => { this.onError?.(null); this.onStatus?.(true); };

    this.ws.onmessage = (e) => {
      try {
        this.onMessage?.(JSON.parse(e.data as string) as ChatMessagePayload);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onclose = (e) => {
      this.onStatus?.(false);
      const code = (e as { code?: number }).code;
      if (code === CLOSE_UNAUTHENTICATED) { this.onError?.('unauthenticated'); return; }
      if (code === CLOSE_NOT_MEMBER) { this.onError?.('not_member'); return; }
      this.scheduleReconnect();
    };

    this.ws.onerror = () => this.onStatus?.(false);
  }

  private scheduleReconnect() {
    if (this.manuallyClosed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(body: string): boolean {
    if (!this.isOpen) return false;
    this.ws!.send(JSON.stringify({ body }));
    return true;
  }

  disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.ws?.close();
    this.ws = null;
  }
}
