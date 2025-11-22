// // hooks/useWebRTC.js

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
//   const cleanupRef = useRef(null);
//   // --- Cleanup function ---
//   const cleanup = useCallback(() => {
//     addLog("🧹 Membersihkan sumber daya WebRTC...", "info");

//     // Remove socket listeners
//     if (socket.current) {
//       // Gunakan ref untuk menghapus listener yang spesifik
//       const listenersToCleanup = cleanupRef.current || [];
//       listenersToCleanup.forEach(({ event, handler }) => {
//         socket.current.off(event, handler);
//       });
//       cleanupRef.current = [];
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

//   // --- Fungsi Handler (Dipindahkan ke luar useEffect untuk optimasi) ---
//   const handleDeviceFound = useCallback(
//     async (data) => {
//       if (data.deviceId !== deviceId) return;
//       if (isCallingRef.current) return;

//       isCallingRef.current = true;
//       addLog("📞 Memulai panggilan ke child device...", "info");

//       try {
//         const offer = await pcRef.current.createOffer({
//           offerToReceiveVideo: true,
//           offerToReceiveAudio: true
//         });
//         await pcRef.current.setLocalDescription(offer);

//         socket.current.emit(SOCKET_EVENTS.OFFER, { to: deviceId, sdp: offer });
//         addLog("✅ Offer dikirim ke child device", "info");

//         setTimeout(() => {
//           if (isCallingRef.current) {
//             addLog("⏱️ Timeout menunggu jawaban dari child device", "error");
//             isCallingRef.current = false;
//           }
//         }, 10000);
//       } catch (err) {
//         addLog(`❌ Gagal create offer: ${err.message}`, "error");
//         isCallingRef.current = false;
//       }
//     },
//     [socket, deviceId, addLog]
//   );

//   const handleRemoteOffer = useCallback(
//     async (data) => {
//       if (!pcRef.current) return;

//       addLog("📩 Menerima offer baru dari child (renegotiation)", "info");

//       try {
//         // Set remote description dengan offer baru dari anak
//         const offerDesc = new RTCSessionDescription(data.sdp);
//         await pcRef.current.setRemoteDescription(offerDesc);
//         addLog("✅ Remote description (offer baru) berhasil diset", "info");

//         // Buat jawaban (answer) untuk offer baru tersebut
//         const answer = await pcRef.current.createAnswer();
//         await pcRef.current.setLocalDescription(answer);
//         addLog("📄 Jawaban (answer) untuk offer baru dibuat", "info");

//         // Kirim jawaban kembali ke anak
//         socket.current.emit(SOCKET_EVENTS.ANSWER, {
//           to: data.from, // Kirim ke socket ID anak yang mengirim offer
//           sdp: answer.sdp
//         });
//         addLog("📤 Jawaban (answer) dikirim ke child", "info");
//       } catch (err) {
//         addLog(`❌ Gagal memproses offer baru: ${err.message}`, "error");
//       }
//     },
//     [socket, addLog]
//   );

//   const handleAnswer = useCallback(
//     async (data) => {
//       if (!pcRef.current) return;

//       if (!data || !data.sdp) {
//         addLog(
//           "❌ Data jawaban (answer) tidak valid atau tidak lengkap",
//           "error"
//         );
//         addLog(`Data diterima: ${JSON.stringify(data)}`, "error");
//         return;
//       }

//       let sdpString = "";

//       if (typeof data.sdp === "object" && data.sdp.sdp) {
//         sdpString = data.sdp.sdp;
//         addLog("DEBUG: data.sdp adalah objek, mengambil properti .sdp", "info");
//       } else if (typeof data.sdp === "string") {
//         sdpString = data.sdp;
//         addLog(
//           "DEBUG: data.sdp adalah string, menggunakannya langsung",
//           "info"
//         );
//       } else {
//         addLog("❌ Format data.sdp tidak dikenali", "error");
//         addLog(`Tipe data.sdp: ${typeof data.sdp}`, "error");
//         return;
//       }

//       try {
//         addLog("📥 Menerima jawaban dari child device...", "info");

//         const answerDesc = new RTCSessionDescription({
//           sdp: sdpString,
//           type: "answer"
//         });

//         // Gunakan Promise untuk memastikan setRemoteDescription selesai SEBELUM menerapkan kandidat
//         await pcRef.current
//           .setRemoteDescription(answerDesc)
//           .then(async () => {
//             addLog("✅ Remote description (answer) berhasil diset", "info");

//             // Sekarang aman untuk mengatur flag dan menerapkan kandidat
//             remoteDescriptionSetRef.current = true;

//             addLog(
//               `DEBUG: Menerapkan ${pendingCandidatesRef.current.length} kandidat tertunda.`,
//               "info"
//             );

//             // Apply pending ICE candidates
//             for (const candidateData of pendingCandidatesRef.current) {
//               try {
//                 addLog(
//                   `DEBUG: Menerapkan kandidat tertunda: ${candidateData.candidate}`,
//                   "ice"
//                 );
//                 await pcRef.current.addIceCandidate(
//                   new RTCIceCandidate(candidateData)
//                 );
//                 addLog("🧊 Kandidat tertunda berhasil diterapkan", "success");
//               } catch (err) {
//                 addLog(
//                   `❌ Gagal menerapkan kandidat tertunda: ${err.toString()}`,
//                   "error"
//                 );
//               }
//             }
//             pendingCandidatesRef.current = [];
//             isCallingRef.current = false;
//             addLog("✅ Semua kandidat tertunda telah diterapkan.", "success");
//           })
//           .catch((err) => {
//             addLog(`❌ Gagal set remote description: ${err.message}`, "error");
//             isCallingRef.current = false;
//           });
//       } catch (err) {
//         addLog(`❌ Error umum saat memproses answer: ${err.message}`, "error");
//         isCallingRef.current = false;
//       }
//     },
//     [addLog]
//   );

//   const handleRemoteIce = useCallback(
//     async (data) => {
//       // Log data mentah yang diterima untuk debugging
//       addLog(
//         `DEBUG: Menerima data ICE mentah: ${JSON.stringify(data)}`,
//         "info"
//       );

//       if (!data || !data.candidate) {
//         addLog("❌ Data ICE candidate tidak valid", "error");
//         return;
//       }

//       // Anak mengirim objek kandidat di dalam properti 'candidate'
//       const candidateData = data.candidate;

//       if (!remoteDescriptionSetRef.current) {
//         if (
//           !pendingCandidatesRef.current.some(
//             (e) => e.candidate === candidateData.candidate
//           )
//         ) {
//           pendingCandidatesRef.current.push(candidateData);
//           addLog("🧊 Kandidat ditunda sampai remoteDescription siap", "ice");
//         }
//         return;
//       }

//       try {
//         // Log kandidat yang akan ditambahkan
//         addLog(
//           `DEBUG: Menerapkan ICE candidate: ${candidateData.candidate}`,
//           "ice"
//         );

//         // Buat RTCIceCandidate dari objek kandidat
//         const candidate = new RTCIceCandidate(candidateData);
//         await pcRef.current.addIceCandidate(candidate);

//         addLog("🧊 Remote ICE candidate diterapkan", "success");
//       } catch (err) {
//         // Tambahkan error detail untuk debugging
//         addLog(
//           `❌ Gagal menambahkan ICE candidate: ${err.toString()}`,
//           "error"
//         );
//         addLog(`Error Detail: ${err.name} - ${err.message}`, "error");
//       }
//     },
//     [addLog]
//   );

//   // --- Main Effect Hook ---
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

//     // --- Event Handlers untuk PeerConnection ---
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

//         // --- PERBAIKAN: Bungkus candidate dalam objek ---
//         const payload = {
//           to: deviceId, // deviceId adalah "4"
//           candidate: {
//             candidate: event.candidate.candidate,
//             sdpMid: event.candidate.sdpMid,
//             sdpMLineIndex: event.candidate.sdpMLineIndex
//           }
//         };

//         socket.current.emit(SOCKET_EVENTS.ICE_CANDIDATE, payload);
//         addLog(`🧊 ICE candidate dikirim ke ${deviceId}`, "ice");
//       } else if (!event.candidate) {
//         addLog("🧊 ICE gathering selesai", "ice");
//       }
//     };

//     pc.oniceconnectionstatechange = () => {
//       console.log("ICE STATE CHANGED TO:", pc.iceConnectionState); // Tambah ini
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

//     // --- Pendaftaran Socket Listener ---
//     // Hapus listener lama sebelum menambahkan yang baru untuk mencegah duplikasi
//     const listenersToCleanup = cleanupRef.current || [];
//     listenersToCleanup.forEach(({ event, handler }) => {
//       socket.current.off(event, handler);
//     });

//     // Daftarkan listener baru dan simpan referensinya untuk cleanup
//     const newListeners = [
//       { event: SOCKET_EVENTS.DEVICE_FOUND, handler: handleDeviceFound },
//       { event: SOCKET_EVENTS.OFFER, handler: handleRemoteOffer }, // Tambahkan handler untuk offer dari anak
//       { event: SOCKET_EVENTS.ANSWER, handler: handleAnswer },
//       { event: SOCKET_EVENTS.ICE_CANDIDATE, handler: handleRemoteIce }
//     ];
//     newListeners.forEach(({ event, handler }) => {
//       socket.current.on(event, handler);
//     });
//     cleanupRef.current = newListeners;

//     addLog("✅ Socket event handlers didaftarkan", "info");

//     // --- Mulai watch device ---
//     socket.current.emit(SOCKET_EVENTS.WATCH_DEVICE, deviceId);
//     addLog(`📡 Permintaan watch-device dikirim ke ${deviceId}`, "info");

//     // Fungsi cleanup akan dijalankan saat komponen tidak lagi digunakan
//     return () => {
//       cleanup();
//     };
//   }, [
//     socket,
//     deviceId,
//     addLog,
//     cleanup,
//     handleDeviceFound,
//     handleRemoteOffer,
//     handleAnswer,
//     handleRemoteIce
//   ]); // Tambahkan semua handler ke dependency

//   return videoRef;
// }
