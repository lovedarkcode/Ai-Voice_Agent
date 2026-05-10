import { useEffect, useRef } from "react";

export default function AudioPlayer({ audioUrl, onPlayStart, onPlayEnd }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioUrl) return;

        const audio = audioRef.current;
        if (!audio) return;

        audio.src = audioUrl;

        const handlePlay = () => onPlayStart?.();
        const handleEnded = () => {
            onPlayEnd?.();
            URL.revokeObjectURL(audioUrl); // free memory
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("ended", handleEnded);
        audio.play().catch(console.error);

        return () => {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [audioUrl, onPlayStart, onPlayEnd]);

    return <audio ref={audioRef} hidden />;
}