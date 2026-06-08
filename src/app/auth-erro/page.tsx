"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Content() {
  const p = useSearchParams();
  const error = p.get("error") ?? "(vazio)";
  return (
    <div style={{ fontFamily: "monospace", padding: 32, background: "#fff0f0", minHeight: "100vh" }}>
      <h2 style={{ color: "red" }}>ERRO OAUTH — código:</h2>
      <pre style={{ fontSize: 28, fontWeight: "bold", color: "#900", padding: 16, background: "#ffe", border: "2px solid red" }}>
        {error}
      </pre>
      <p>URL completa:</p>
      <pre style={{ fontSize: 12, wordBreak: "break-all" }}>
        {typeof window !== "undefined" ? window.location.href : ""}
      </pre>
      <Link href="/entrar" style={{ display: "block", marginTop: 24, color: "blue" }}>← voltar</Link>
    </div>
  );
}

export default function AuthErroPage() {
  return <Suspense fallback={null}><Content /></Suspense>;
}
