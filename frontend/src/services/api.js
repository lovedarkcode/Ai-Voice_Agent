import axios from "axios";

// Empty baseURL = relative paths = Vite proxy forwards to backend
const api = axios.create({
    baseURL: "",
    timeout: 30000,
});

// ── STT: upload audio blob → transcript ──────────────────────────────────────
export async function transcribeAudio(audioBlob, sessionId) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    if (sessionId) formData.append("session_id", sessionId);

    const { data } = await api.post("/api/voice/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

// ── LLM: transcript + history → AI response ──────────────────────────────────
export async function sendToLLM(transcript, sessionId, history = []) {
    const { data } = await api.post("/api/chat/", {
        transcript,
        session_id: sessionId,
        history,
    });
    return data;
}

// ── TTS: text → audio blob URL ────────────────────────────────────────────────
export async function synthesizeSpeech(text, voiceId = null) {
    const response = await api.post(
        "/api/tts/synthesize",
        { text, voice_id: voiceId },
        { responseType: "blob" }
    );
    return URL.createObjectURL(response.data);
}

// ── Clear session history ─────────────────────────────────────────────────────
export async function clearHistory(sessionId) {
    const { data } = await api.delete(`/api/chat/${sessionId}`);
    return data;
}

// ── Health check ─────────────────────────────────────────────────────────────
export async function healthCheck() {
    const { data } = await api.get("/health");
    return data;
}