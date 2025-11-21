// app/components/parenting/cameraview.jsx
"use client";
import { useEffect, useRef } from "react";
import { useWebRTC } from "@/hooks/webrtc";

export default function CameraView({ socket, deviceId, addLog }) {
  // Ambil ref dari hook useWebRTC
  const videoRef = useWebRTC({ socket, deviceId, addLog });

  // --- SOLUSI: Gunakan useEffect untuk memantau videoRef ---
  useEffect(() => {
    // Jangan jalankan jika videoRef belum ada (saat render pertama)
    if (!videoRef.current) {
      addLog("[UI] Video ref belum ada, menunggu render...", "info");
      return;
    }

    // Tambahkan event listener untuk debugging
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        addLog(
          `[UI] Metadata video dimuat. Ukuran: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`,
          "info"
        );
      }
    };

    const handleError = (e) => {
      addLog(`[UI] Error video: ${e.message}`, "error");
    };

    videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoRef.current.addEventListener("error", handleError);

    // Bersihkan listener saat komponen tidak lagi digunakan
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoRef.current.removeEventListener("error", handleError);
      }
    };
  }, [videoRef, addLog]); // Dependency array penting!

  // --- SOLUSI: Render video dengan ref yang sudah ada ---
  return (
    <video
      ref={videoRef} // <<<< GUNAKAN REF YANG SUDAH ADA
      autoPlay
      playsInline
      muted // Tetap muted untuk autoplay
      style={{ width: "100%", background: "#000", display: "block" }}
      controls // Tambahkan kontrol untuk debugging
    />
  );
}
