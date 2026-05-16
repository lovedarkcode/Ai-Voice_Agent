import { useEffect, useRef, useCallback } from "react";
import useAudioRecorder from "../hooks/useAudiorecorder";

export default function VoiceRecorder({ onAudioReady, disabled }) {
    const {
        isRecording, audioBlob, error,
        startRecording, stopRecording, resetRecording,
    } = useAudioRecorder();

    const btnRef = useRef(null);

    // Fire callback when blob is ready
    useEffect(() => {
        if (audioBlob) {
            onAudioReady(audioBlob);
            resetRecording();
        }
    }, [audioBlob, onAudioReady, resetRecording]);

    const handleClick = useCallback(() => {
        if (disabled) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [disabled, isRecording, startRecording, stopRecording]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

            {/* Waveform bars */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "40px", minWidth: "100px", justifyContent: "center" }}>
                {isRecording ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <span key={i} className="wave-bar" style={{
                            display: "block", width: "4px", height: "12px",
                            borderRadius: "2px"
                        }} />
                    ))
                ) : (
                    <div className="mono" style={{ fontSize: "10px", color: "var(--accent-primary)", opacity: 0.3, letterSpacing: "2px" }}>
                        STANDING_BY
                    </div>
                )}
            </div>

            {/* Button */}
            <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Decorative outer ring */}
                <div style={{
                    position: "absolute", inset: "-10px",
                    borderRadius: "50%", border: "1px solid rgba(0, 242, 255, 0.1)",
                    animation: isRecording ? "pulse 1s infinite ease-in-out" : "none"
                }} />
                
                {isRecording && (
                    <span className="ping-slow" style={{
                        position: "absolute", inset: 0,
                        borderRadius: "50%", background: "var(--accent-primary)",
                        opacity: 0.2
                    }} />
                )}
                
                <button
                    ref={btnRef}
                    onClick={handleClick}
                    disabled={disabled}
                    className="glass-card"
                    style={{
                        position: "relative", zIndex: 1,
                        width: "80px", height: "80px",
                        borderRadius: "50%",
                        border: isRecording ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                        background: isRecording ? "rgba(0, 242, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                        color: isRecording ? "var(--accent-primary)" : "var(--text-secondary)",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.3 : 1,
                        transform: isRecording ? "scale(1.1)" : "scale(1)",
                        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: isRecording ? "0 0 30px rgba(0, 242, 255, 0.3)" : "none",
                        userSelect: "none",
                    }}
                >
                    {isRecording ? (
                        <div style={{ position: "relative" }}>
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="7" y="7" width="10" height="10" rx="1.5" />
                            </svg>
                            <div style={{ 
                                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                                width: "40px", height: "40px", borderRadius: "50%",
                                border: "2px solid var(--accent-primary)", opacity: 0.5,
                                animation: "ping-slow 1s infinite"
                            }} />
                        </div>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.93V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-1.07A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z" />
                        </svg>
                    )}
                </button>
            </div>

            <p className="mono" style={{ fontSize: "10px", color: isRecording ? "var(--accent-primary)" : "var(--text-secondary)", letterSpacing: "1px", opacity: 0.6 }}>
                {isRecording ? "CLICK_TO_SEND" : "CLICK_TO_RECORD"}
            </p>

            {error && (
                <p className="mono" style={{ fontSize: "10px", color: "#f87171", textAlign: "center", maxWidth: "260px" }}>
                    ERROR: {error}
                </p>
            )}
        </div>
    );
}
