export default function StatusIndicator({ status }) {
    const states = {
        idle: { color: "var(--accent-primary)", label: "SYSTEM_READY", opacity: 0.5 },
        recording: { color: "#ef4444", label: "AUDIO_INPUT_ACTIVE", opacity: 1 },
        transcribing: { color: "var(--accent-primary)", label: "ANALYZING_VOICE_DATA", opacity: 1 },
        thinking: { color: "var(--accent-secondary)", label: "NEURAL_PROCESSING", opacity: 1 },
        synthesizing: { color: "#c084fc", label: "GENERATING_RESPONSE", opacity: 1 },
        playing: { color: "#34d399", label: "OUTPUT_STREAM_ACTIVE", opacity: 1 },
        error: { color: "#ef4444", label: "CORE_SYSTEM_ERROR", opacity: 1 },
    };

    const cur = states[status] || states.idle;
    const shouldPulse = status !== "idle";

    return (
        <div className="glass-card mono" style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "8px 20px", borderRadius: "8px",
            border: `1px solid ${cur.color}33`,
            background: "rgba(0,0,0,0.3)",
            boxShadow: shouldPulse ? `0 0 20px ${cur.color}22` : "none"
        }}>
            <div style={{ position: "relative", width: "8px", height: "8px" }}>
                <span
                    className={shouldPulse ? "pulse" : ""}
                    style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: cur.color, display: "block",
                        boxShadow: `0 0 10px ${cur.color}`
                    }}
                />
            </div>
            <span style={{ fontSize: "11px", color: cur.color, letterSpacing: "1px", fontWeight: 500 }}>
                {cur.label}
            </span>
        </div>
    );
}