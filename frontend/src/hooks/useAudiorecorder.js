import { useState, useRef, useCallback } from "react";

export default function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? { mimeType: "audio/webm;codecs=opus" }
                : { mimeType: "audio/webm" };

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: options.mimeType });
                setAudioBlob(blob);
                // Stop all mic tracks so the browser mic indicator turns off
                stream.getTracks().forEach((t) => t.stop());
            };

            recorder.start(100); // collect data every 100ms
            setIsRecording(true);
        } catch (err) {
            if (err.name === "NotAllowedError") {
                setError("Microphone permission denied. Please allow mic access.");
            } else {
                setError("Could not access microphone: " + err.message);
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setError(null);
        chunksRef.current = [];
    }, []);

    return {
        isRecording,
        audioBlob,
        error,
        startRecording,
        stopRecording,
        resetRecording,
    };
}