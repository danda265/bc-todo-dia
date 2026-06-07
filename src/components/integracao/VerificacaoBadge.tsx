"use client";

type Props = {
  status: string;
  verificadoEm?: string | null;
  size?: "sm" | "md" | "lg";
};

const BADGE_CONFIG: Record<string, { icon: string; label: string; cor: string; bg: string }> = {
  NAO_SOLICITADA: { icon: "○", label: "Não verificado", cor: "text-gray-500", bg: "bg-gray-100" },
  PENDENTE_ADMIN: { icon: "⏳", label: "Em análise", cor: "text-yellow-700", bg: "bg-yellow-100" },
  VERIFICADO_GOOGLE: { icon: "✅", label: "Verificado via Google", cor: "text-green-700", bg: "bg-green-100" },
  VERIFICADO_MANUAL: { icon: "✅", label: "Verificado", cor: "text-green-700", bg: "bg-green-100" },
  REJEITADO: { icon: "✗", label: "Não verificado", cor: "text-red-600", bg: "bg-red-100" },
};

export default function VerificacaoBadge({ status, verificadoEm, size = "md" }: Props) {
  const cfg = BADGE_CONFIG[status] ?? BADGE_CONFIG["NAO_SOLICITADA"];
  const data = verificadoEm ? new Date(verificadoEm).toLocaleDateString("pt-BR") : null;

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-sm px-4 py-2" : "text-xs px-3 py-1";

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.cor} ${cfg.bg} ${sizeClass}`}>
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </span>
      {data && <span className="text-xs text-gray-400">desde {data}</span>}
    </div>
  );
}

// Para uso na página pública (destaque maior)
export function VerificacaoBadgePublico({ status }: { status: string }) {
  if (status !== "VERIFICADO_GOOGLE" && status !== "VERIFICADO_MANUAL") return null;
  const isGoogle = status === "VERIFICADO_GOOGLE";

  return (
    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
      <span>✅</span>
      <span>Proprietário verificado{isGoogle ? " via Google" : ""}</span>
    </div>
  );
}
