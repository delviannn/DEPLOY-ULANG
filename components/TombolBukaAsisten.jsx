"use client";

export default function TombolBukaAsisten() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("katalog:buka-asisten"))} className="rounded-lg bg-utama px-3 py-2 text-sm font-bold text-white hover:bg-utama-gelap">
    Chat AI
  </button>;
}
