import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000";

export default function useWebSocket(sessionId, { onMessage, onError } = {}) {
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(() => {
        if (!sessionId) return;
        const url = `${WS_URL}/ws/${sessionId}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                onMessage?.({ type: "audio_blob", blob: event.data });
            } else {
                try {
                    onMessage?.(JSON.parse(event.data));
                } catch {
                    onMessage?.({ type: "raw", data: event.data });
                }
            }
        };
        ws.onerror = (e) => { setConnected(false); onError?.(e); };
        ws.onclose = () => setConnected(false);
    }, [sessionId, onMessage, onError]);

    const disconnect = useCallback(() => {
        wsRef.current?.close();
        setConnected(false);
    }, []);

    const sendAudio = useCallback((audioBlob) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(audioBlob);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { connected, sendAudio, disconnect, reconnect: connect };
}