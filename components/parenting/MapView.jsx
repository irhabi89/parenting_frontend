// frontend/src/components/parenting/MapView.jsx
"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useState, useMemo, useEffect, useRef } from "react"; // Tambahkan useRef
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Ikon Anak
const childIcon = L
  ? new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  : null;

// ====================================================================

// --- KOMPONEN BARU: Berpusat Otomatis ke Lokasi Baru ---
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();

  // 🔥 FIX 3: Strict Mode Guard
  const isInitialMount = useRef(true);
  const isStrict = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Terapkan Guard: Skip eksekusi pertama di Strict Mode
    if (isStrict && isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Logika Utama (Hanya berjalan pada setup kedua di dev, atau saat props berubah)
    if (lat !== undefined && lng !== undefined) {
      map.setView([lat, lng]);

      console.log(`[MAP] Peta berpusat otomatis ke: Lat=${lat}, Lng=${lng}`);
    }
  }, [lat, lng, map]);

  return null;
}
// ====================================================================

// Komponen Pembantu untuk Mengubah URL TileLayer
function ChangeTileLayer({ mapType, subdomains }) {
  // ... (Sisa kode ChangeTileLayer) ...
  const map = useMap();
  const tileLayers = {
    // Normal/Roadmap
    normal: {
      url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: "© Google Maps"
    },
    // Satelit (lyrs=s)
    satelit: {
      url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: "© Google Satellite"
    },
    // Hybrid (Satelit + Jalan/Label) (lyrs=s,h)
    hybrid: {
      url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      attribution: "© Google Hybrid"
    }
  };

  const activeLayer = useMemo(
    () => tileLayers[mapType] || tileLayers.osm,
    [mapType]
  );

  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer || layer instanceof L.TileLayer.WMS) {
      map.removeLayer(layer);
    }
  });

  L.tileLayer(activeLayer.url, {
    maxZoom: 20,
    subdomains: subdomains,
    attribution: activeLayer.attribution
  }).addTo(map);

  return null;
}

// ====================================================================

export default function MapView({ location }) {
  const [mapType, setMapType] = useState("hybrid");

  if (!location || location.lat === undefined || location.lng === undefined) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Memuat lokasi anak...</p>
      </div>
    );
  }

  const subdomains = ["mt0", "mt1", "mt2", "mt3"];
  const { lat, lng } = location;

  return (
    <div style={{ position: "relative" }}>
      {/* Kontrol Tombol di atas peta */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "5px",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
        }}
      >
        <button
          onClick={() => setMapType("hybrid")}
          style={{
            fontWeight: mapType === "hybrid" ? "bold" : "normal",
            marginRight: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            border: "none",
            borderRadius: "3px"
          }}
        >
          Hybrid
        </button>
        <button
          onClick={() => setMapType("satelit")}
          style={{
            fontWeight: mapType === "satelit" ? "bold" : "normal",
            marginRight: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            border: "none",
            borderRadius: "3px"
          }}
        >
          Satelit
        </button>
        <button
          onClick={() => setMapType("normal")}
          style={{
            fontWeight: mapType === "normal" ? "bold" : "normal",
            marginRight: "5px",
            padding: "5px 10px",
            cursor: "pointer",
            border: "none",
            borderRadius: "3px"
          }}
        >
          Normal
        </button>
      </div>

      <MapContainer
        // Set pusat awal ke lokasi yang diterima
        center={[lat, lng]}
        zoom={16}
        style={{ height: 400, width: "100%" }}
        // key={lat + "-" + lng} // Hapus key ini jika RecenterAutomatically sudah fix, untuk menghindari reload total.
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0}
        />

        {/* Komponen untuk mengubah layer */}
        <ChangeTileLayer mapType={mapType} subdomains={subdomains} />

        {/* PENTING: Komponen yang memicu pemusatan ulang/pan saat lokasi berubah */}
        <RecenterAutomatically lat={lat} lng={lng} />

        {/* Marker Anak dengan Ikon Kustom */}
        <Marker position={[lat, lng]} icon={childIcon}>
          <Popup>Lokasi Perangkat Anak</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
