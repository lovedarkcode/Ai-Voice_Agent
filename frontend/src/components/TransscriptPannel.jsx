import { useEffect, useRef } from "react";

export default function TranscriptPanel({ messages }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!messages.length) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", color: "var(--text-secondary)", gap: "16px",
                opacity: 0.5
            }}>
                <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    border: "1px dashed var(--accent-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "pulse 3s infinite"
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="var(--accent-primary)" strokeWidth="1.5">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <p className="mono" style={{ fontSize: "12px", letterSpacing: "1px" }}>AWAITING_VOICE_COMMAND...</p>
            </div>
        );
    }

    return (
        <div className="custom-scrollbar" style={{
            display: "flex", flexDirection: "column", gap: "20px",
            overflowY: "auto", height: "100%", paddingRight: "10px"
        }}>
            {messages.map(msg => (
                <div key={msg.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                    animation: "slide-up 0.4s ease-out forwards"
                }}>
                    <div className="mono" style={{ 
                        fontSize: "9px", 
                        color: msg.role === "user" ? "var(--accent-primary)" : "var(--accent-secondary)",
                        marginBottom: "6px",
                        letterSpacing: "1px",
                        opacity: 0.7
                    }}>
                        {msg.role === "user" ? "USER_INPUT" : "AGENT_RESPONSE"} [{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]
                    </div>
                    <div style={{
                        maxWidth: "85%", padding: "14px 18px", borderRadius: "12px",
                        fontSize: "14px", lineHeight: "1.6",
                        border: "1px solid rgba(255,255,255,0.05)",
                        ...(msg.role === "user"
                            ? { 
                                background: "rgba(0, 242, 255, 0.05)", 
                                color: "#fff", 
                                borderLeft: "2px solid var(--accent-primary)",
                                borderTopRightRadius: "2px"
                            }
                            : {
                                background: "rgba(112, 0, 255, 0.05)", 
                                color: "#e5e7eb",
                                borderRight: "2px solid var(--accent-secondary)",
                                borderTopLeftRadius: "2px"
                            }
                        )
                    }}>
                        <p style={{ fontWeight: 300 }}>{msg.content}</p>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}