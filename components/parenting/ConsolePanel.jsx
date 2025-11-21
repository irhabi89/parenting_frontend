"use client";
import { useEffect, useRef } from "react";

export default function ConsolePanel({ logs }) {
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-auto text-sm font-mono">
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-gray-500">{log.time}</span> — {log.message}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
