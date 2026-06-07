/**
 * Utilitários de horário de funcionamento
 * Fuso: America/Sao_Paulo (UTC-3)
 */

// Mapa: dia da semana JS (0=Dom…6=Sáb) → chave no JSON de horas
const DIA_KEY: Record<number, string> = {
  0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab",
};

/** Retorna hora e minuto atuais em São Paulo */
function agoraSP(): { hh: number; mm: number; diaSemana: number } {
  const agora = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return { hh: agora.getHours(), mm: agora.getMinutes(), diaSemana: agora.getDay() };
}

/** Converte "HH:MM" em minutos desde meia-noite */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Verifica se um restaurante está aberto agora.
 * @param hoursJson — string JSON no formato { "seg": "09:00-22:00", ... }
 *                    Valor pode ser "Fechado" ou string vazia para dias fechados.
 */
export function estaAberto(hoursJson: string | null | undefined): boolean | null {
  if (!hoursJson) return null; // sem horários cadastrados → desconhecido

  let hours: Record<string, string>;
  try {
    hours = JSON.parse(hoursJson);
  } catch {
    return null;
  }

  const { hh, mm, diaSemana } = agoraSP();
  const chave = DIA_KEY[diaSemana];
  const faixa = chave ? hours[chave] : undefined;

  if (!faixa || faixa.toLowerCase() === "fechado" || faixa.trim() === "") {
    return false;
  }

  // Formato esperado: "09:00-22:00" ou "09:00–22:00"
  const partes = faixa.replace("–", "-").split("-");
  if (partes.length < 2) return null;

  const inicio = toMin(partes[0]!.trim());
  const fim = toMin(partes[1]!.trim());
  const atual = hh * 60 + mm;

  // Suporte a horários que passam da meia-noite (ex: 20:00-02:00)
  if (fim < inicio) {
    return atual >= inicio || atual < fim;
  }
  return atual >= inicio && atual < fim;
}

/** Retorna label amigável do status de funcionamento */
export function labelAberto(aberto: boolean | null): {
  label: string;
  cor: string;
} {
  if (aberto === null) return { label: "", cor: "" };
  if (aberto) return { label: "Aberto agora", cor: "text-green-600 bg-green-50 border-green-200" };
  return { label: "Fechado agora", cor: "text-red-600 bg-red-50 border-red-200" };
}
