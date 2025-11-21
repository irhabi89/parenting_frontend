// import { useEffect, useRef, useCallback } from "react";

// // Nama event socket
// const SOCKET_EVENTS = {
//   DEVICE_FOUND: "device-found",
//   OFFER: "offer",
//   ANSWER: "answer", // Nama event untuk jawaban
//   ICE_CANDIDATE: "ice-candidate", // Nama event untuk kandidat ICE
//   WATCH_DEVICE: "watch-device"
// };

// export function useWebRTC({ socket, deviceId, addLog }) {
//   const pcRef = useRef(null);
//   const videoRef = useRef(null);
//   const isCallingRef = useRef(false);
//   const pendingCandidatesRef = useRef([]);
//   const remoteDescriptionSetRef = useRef(false);
//   const initializedRef = useRef(false);

//   // --- Cleanup function ---
//   const cleanup = useCallback(() => {
//     addLog("🧹 Membersihkan sumber daya WebRTC...", "info");

//     // Remove socket listeners
//     if (socket.current) {
//       socket.current.off(SOCKET_EVENTS.DEVICE_FOUND);
//       socket.current.off(SOCKET_EVENTS.ANSWER);
//       socket.current.off(SOCKET_EVENTS.ICE_CANDIDATE);
//     }

//     // Close PeerConnection
//     if (pcRef.current) {
//       pcRef.current.close();
//       pcRef.current = null;
//       addLog("✅ RTCPeerConnection ditutup", "info");
//     }

//     // Reset video element
//     if (videoRef.current) videoRef.current.srcObject = null;

//     // Reset refs
//     isCallingRef.current = false;
//     pendingCandidatesRef.current = [];
//     remoteDescriptionSetRef.current = false;
//     initializedRef.current = false;

//     addLog("✅ Cleanup WebRTC selesai", "info");
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [socket, addLog]);

//   useEffect(() => {
//     if (!socket?.current || !deviceId) {
//       addLog("⚠️ Socket atau deviceId tidak tersedia. Menunggu...", "warning");
//       return;
//     }

//     // Prevent double initialization
//     if (initializedRef.current) return;
//     initializedRef.current = true;
//     addLog("🔧 Menginisialisasi WebRTC di Parent...", "info");

//     // --- Setup RTCPeerConnection ---
//     const pc = new RTCPeerConnection({
//       iceServers: [
//         { urls: "stun:192.168.1.254:3478" },
//         {
//           urls: "turn:192.168.1.254:3478",
//           username: "webrtc",
//           credential: "webrtc123"
//         }
//       ]
//     });
//     pcRef.current = pc;
//     addLog("✅ RTCPeerConnection dibuat", "info");

//     // --- Event Handlers ---
//     pc.ontrack = (event) => {
//       addLog("📡 onTrack event dipanggil", "info");
//       if (videoRef.current && event.streams[0]) {
//         videoRef.current.srcObject = event.streams[0];
//         addLog("📹 Video stream attached ke video element", "success");
//       }
//     };

//     pc.onicecandidate = (event) => {
//       if (event.candidate && socket.current?.connected) {
//         addLog(`🧊 ICE candidate dibuat: ${event.candidate.candidate}`, "ice");
//         socket.current.emit(SOCKET_EVENTS.ICE_CANDIDATE, {
//           to: deviceId,
//           candidate: event.candidate // Mengirim objek candidate langsung
//         });
//         addLog(`🧊 ICE candidate dikirim ke ${deviceId}`, "ice");
//       } else if (!event.candidate) {
//         addLog("🧊 ICE gathering selesai", "ice");
//       }
//     };

//     pc.oniceconnectionstatechange = () => {
//       addLog(`🔌 ICE connection state: ${pc.iceConnectionState}`, "info");
//       if (["connected", "completed"].includes(pc.iceConnectionState)) {
//         addLog("✅ Koneksi WebRTC berhasil!", "success");
//       } else if (
//         ["failed", "disconnected", "closed"].includes(pc.iceConnectionState)
//       ) {
//         addLog("❌ Koneksi WebRTC gagal atau terputus", "error");
//         isCallingRef.current = false;
//       }
//     };

//     // --- Socket Handlers ---
//     const handleDeviceFound = async (data) => {
//       if (data.deviceId !== deviceId) return;
//       if (isCallingRef.current) return;

//       isCallingRef.current = true;
//       addLog("📞 Memulai panggilan ke child device...", "info");

//       try {
//         const offer = await pc.createOffer({
//           offerToReceiveVideo: true,
//           offerToReceiveAudio: true
//         });
//         await pc.setLocalDescription(offer);

//         socket.current.emit(SOCKET_EVENTS.OFFER, { to: deviceId, sdp: offer });
//         addLog("✅ Offer dikirim ke child device", "info");

//         // Set timeout untuk menunggu jawaban
//         setTimeout(() => {
//           if (isCallingRef.current) {
//             addLog("⏱️ Timeout menunggu jawaban dari child device", "error");
//             isCallingRef.current = false;
//           }
//         }, 10000); // Diperpanjang menjadi 10 detik
//       } catch (err) {
//         addLog(`❌ Gagal create offer: ${err.message}`, "error");
//         isCallingRef.current = false;
//       }
//     };

//     const handleAnswer = async (data) => {
//       if (!pcRef.current) return;
//       // Perbaikan: Memastikan data.sdp ada sebelum diproses
//       if (!data || !data.sdp) {
//         addLog("❌ Data jawaban (answer) tidak valid", "error");
//         return;
//       }

//       try {
//         addLog("📥 Menerima jawaban dari child device...", "info");
//         await pcRef.current.setRemoteDescription(
//           new RTCSessionDescription(data.sdp)
//         );
//         remoteDescriptionSetRef.current = true;

//         // Apply pending ICE candidates
//         for (const candidate of pendingCandidatesRef.current) {
//           await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//         pendingCandidatesRef.current = [];
//         isCallingRef.current = false;
//         addLog("✅ Answer diterapkan dan kandidat tertunda selesai", "info");
//       } catch (err) {
//         addLog(`❌ Gagal set remote description: ${err.message}`, "error");
//         isCallingRef.current = false;
//       }
//     };

//     // --- PERBAIKAN UTAMA: Penanganan ICE Candidate dari Anak (Kode B) ---
//     const handleRemoteIce = async (data) => {
//       // Perbaikan: Memastikan struktur data yang diterima dari Kode B
//       // Kode B mengirim { candidate: { candidate: '...', sdpMid: 0, ... } }
//       if (!data || !data.candidate) {
//         addLog("❌ Data ICE candidate tidak valid", "error");
//         return;
//       }

//       const candidateData = data.candidate;

//       if (!remoteDescriptionSetRef.current) {
//         pendingCandidatesRef.current.push(candidateData);
//         addLog("🧊 Kandidat ditunda sampai remoteDescription siap", "ice");
//       } else {
//         try {
//           // Perbaikan: Menggunakan data.candidate untuk membuat RTCIceCandidate
//           await pcRef.current.addIceCandidate(
//             new RTCIceCandidate(candidateData)
//           );
//           addLog("🧊 Remote ICE candidate diterapkan", "ice");
//         } catch (err) {
//           addLog(`❌ Gagal menambahkan ICE candidate: ${err.message}`, "error");
//         }
//       }
//     };

//     // --- Daftar socket listener ---
//     socket.current.off(SOCKET_EVENTS.DEVICE_FOUND);
//     socket.current.off(SOCKET_EVENTS.ANSWER);
//     socket.current.off(SOCKET_EVENTS.ICE_CANDIDATE);

//     socket.current.on(SOCKET_EVENTS.DEVICE_FOUND, handleDeviceFound);
//     socket.current.on(SOCKET_EVENTS.ANSWER, handleAnswer);
//     socket.current.on(SOCKET_EVENTS.ICE_CANDIDATE, handleRemoteIce);
//     addLog("✅ Socket event handlers didaftarkan", "info");

//     // --- Mulai watch device ---
//     socket.current.emit(SOCKET_EVENTS.WATCH_DEVICE, deviceId);
//     addLog(`📡 Permintaan watch-device dikirim ke ${deviceId}`, "info");

//     return cleanup;
//   }, [socket, deviceId, addLog, cleanup]);

//   return videoRef;
// }
