import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import VoiceRecorder from "../components/VoiceRecorder";
import TranscriptPanel from "../components/TransscriptPannel";
import AudioPlayer from "../components/AudioPlayer";
import StatusIndicator from "../components/StatusIndicator";
import useWebSocket from "../hooks/usewebsocket";
import { transcribeAudio, sendToLLM, synthesizeSpeech, clearHistory } from "../services/api";

export default function AgentPage() {
    const sessionId = useRef(uuidv4()).current;
    const [status, setStatus] = useState("idle");
    const [messages, setMessages] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [useWS, setUseWS] = useState(false); // start in REST mode — safer default
    const [errorMessage, setErrorMessage] = useState("");

    const addMessage = (role, content) =>
        setMessages(prev => [...prev, { id: uuidv4(), role, content, timestamp: Date.now() }]);

    // ── WebSocket handler ──────────────────────────────────────────────────────
    const handleWsMessage = useCallback((msg) => {
        switch (msg.type) {
            case "status":
                if (msg.message?.includes("Transcrib")) setStatus("transcribing");
                if (msg.message?.includes("Thinking")) setStatus("thinking");
                if (msg.message?.includes("Synthesiz")) setStatus("synthesizing");
                break;
            case "transcript":
                addMessage("user", msg.text);
                break;
            case "llm_chunk":
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant" && last._streaming)
                        return [...prev.slice(0, -1), { ...last, content: last.content + msg.text }];
                    return [...prev, {
                        id: uuidv4(), role: "assistant", content: msg.text,
                        timestamp: Date.now(), _streaming: true
                    }];
                });
                break;
            case "tts_ready": setStatus("playing"); break;
            case "audio_blob": setAudioUrl(URL.createObjectURL(msg.blob)); break;
            case "error":
                setErrorMessage(msg.message || "Backend request failed.");
                setStatus("error");
                setTimeout(() => setStatus("idle"), 3000);
                break;
            default: break;
        }
    }, []);

    const { connected, sendAudio } = useWebSocket(useWS ? sessionId : null, {
        onMessage: handleWsMessage,
        onError: () => {
            setErrorMessage("WebSocket connection failed.");
            setStatus("error");
        },
    });

    // ── Audio ready ────────────────────────────────────────────────────────────
    const handleAudioReady = useCallback(async (blob) => {
        setErrorMessage("");
        if (useWS && connected) {
            setStatus("transcribing");
            sendAudio(blob);
            return;
        }
        try {
            setStatus("transcribing");
            const { transcript, session_id } = await transcribeAudio(blob, sessionId);
            addMessage("user", transcript);

            setStatus("thinking");
            const { response } = await sendToLLM(transcript, session_id);
            addMessage("assistant", response);

            setStatus("synthesizing");
            const url = await synthesizeSpeech(response);
            setAudioUrl(url);
            setStatus("playing");
        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail || err.message || "Backend request failed.";
            setErrorMessage(detail);
            addMessage("assistant", `Request failed: ${detail}`);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 5000);
        }
    }, [useWS, connected, sendAudio, sessionId]);

    const handleClear = async () => {
        setMessages([]);
        await clearHistory(sessionId).catch(() => { });
    };

    return (
        <div className="app-container" style={{
            minHeight: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", padding: "40px 20px", position: "relative"
        }}>
            {/* HUD Corner Accents */}
            <div style={{ position: "absolute", top: 20, left: 20, width: 40, height: 40, borderTop: "2px solid var(--accent-primary)", borderLeft: "2px solid var(--accent-primary)", opacity: 0.5 }} />
            <div style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderTop: "2px solid var(--accent-primary)", borderRight: "2px solid var(--accent-primary)", opacity: 0.5 }} />
            <div style={{ position: "absolute", bottom: 20, left: 20, width: 40, height: 40, borderBottom: "2px solid var(--accent-primary)", borderLeft: "2px solid var(--accent-primary)", opacity: 0.5 }} />
            <div style={{ position: "absolute", bottom: 20, right: 20, width: 40, height: 40, borderBottom: "2px solid var(--accent-primary)", borderRight: "2px solid var(--accent-primary)", opacity: 0.5 }} />

            {/* Header */}
            <header style={{
                width: "100%", maxWidth: "800px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "40px", zIndex: 10
            }}>
                <div>
                    <h1 className="accent-text" style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px" }}>
                        NEURAL AGENT <span style={{ fontSize: "12px", verticalAlign: "middle", opacity: 0.6 }}>v2.0</span>
                    </h1>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: connected ? "var(--accent-primary)" : "#ef4444", display: "inline-block" }} />
                        {useWS ? "WS_PROTOCOL_ACTIVE" : "REST_API_FALLBACK"} | SESSION_{sessionId.slice(0, 8)}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => setUseWS(v => !v)} className="glass-card mono" style={btnStyle}>
                        {useWS ? "MODE: REST" : "MODE: WS"}
                    </button>
                    <button onClick={handleClear} className="glass-card mono" style={{ ...btnStyle, color: "#f87171" }}>
                        CLEAR_LOGS
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", zIndex: 10 }}>
                
                {/* Transcript Panel Container */}
                <div className="glass-card" style={{
                    width: "100%",
                    height: "500px",
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
                }}>
                    <div className="mono" style={{ fontSize: "10px", color: "var(--accent-primary)", marginBottom: "16px", opacity: 0.5, display: "flex", justifyContent: "space-between" }}>
                        <span>&gt; DATA_STREAM_INCOMING</span>
                        <span>{messages.length} PACKETS</span>
                    </div>
                    <TranscriptPanel messages={messages} />
                </div>

                {/* Status and Controls */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                    <StatusIndicator status={status} detail={errorMessage} />
                    
                    <div style={{ position: "relative" }}>
                        {/* Decorative Rings */}
                        <div style={{ 
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: "120px", height: "120px", borderRadius: "50%",
                            border: "1px solid rgba(0, 242, 255, 0.1)",
                            animation: "pulse 2s infinite ease-in-out"
                        }} />
                        
                        <VoiceRecorder
                            onAudioReady={handleAudioReady}
                            disabled={!["idle", "playing"].includes(status)}
                        />
                    </div>
                </div>
            </main>

            <AudioPlayer
                audioUrl={audioUrl}
                onPlayStart={() => setStatus("playing")}
                onPlayEnd={() => setStatus("idle")}
            />
        </div>
    );
}

const btnStyle = {
    fontSize: "11px", padding: "8px 16px",
    background: "rgba(255,255,255,0.03)", color: "var(--text-secondary)",
    cursor: "pointer", transition: "all 0.3s ease",
    letterSpacing: "1px"
};
