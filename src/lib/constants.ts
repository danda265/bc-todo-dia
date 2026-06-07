// BC Todo Dia — Constantes compartilhadas
// Fonte única de verdade. Frontend, API Routes e schema referenciam daqui.

import { BusinessCategory, Bairro, UserRole, OfferTarget } from "@prisma/client";

// ─── Categorias de negócios ────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  RESTAURANTES: "Restaurantes",
  BARES_BALADAS: "Bares & Baladas",
  LOJAS_MODA: "Lojas & Moda",
  BELEZA_ESTETICA: "Beleza & Estética",
  HOSPEDAGEM: "Hospedagem",
  ESPORTES_AVENTURA: "Esportes & Aventura",
  CULTURA_ARTE: "Cultura & Arte",
  SERVICOS_LOCAIS: "Serviços Locais",
};

export const CATEGORY_ICONS: Record<BusinessCategory, string> = {
  RESTAURANTES: "🍽️",
  BARES_BALADAS: "🎵",
  LOJAS_MODA: "🛍️",
  BELEZA_ESTETICA: "💅",
  HOSPEDAGEM: "🏨",
  ESPORTES_AVENTURA: "🏄",
  CULTURA_ARTE: "🎨",
  SERVICOS_LOCAIS: "🔧",
};

// ─── Bairros ──────────────────────────────────────────────────────────────────

export const BAIRRO_LABELS: Record<Bairro, string> = {
  CENTRO: "Centro",
  BARRA_SUL: "Barra Sul",
  INTERPRAIAS: "Interpraias",
  MUNICAO: "Municão",
  ARQUIPELAGO: "Arquipélago",
  CANTO_DO_MORCEGO: "Canto do Morcego",
  PRAIA_LARANJEIRAS: "Praia das Laranjeiras",
  PRAIA_DOS_AMORES: "Praia dos Amores",
  PIONEIROS: "Pioneiros",
  OUTRO: "Outro",
};

// ─── Perfis de usuário ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  COMERCIANTE: "Comerciante",
  MORADOR: "Morador",
  TURISTA: "Turista",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  COMERCIANTE: "Cadastre seu negócio e crie ofertas exclusivas",
  MORADOR: "Descubra o melhor de BC perto de você",
  TURISTA: "Encontre experiências autênticas além da praia",
};

export const ROLE_ICONS: Record<UserRole, string> = {
  COMERCIANTE: "🏪",
  MORADOR: "🏠",
  TURISTA: "🌊",
};

// ─── Targets de oferta ────────────────────────────────────────────────────────

export const OFFER_TARGET_LABELS: Record<OfferTarget, string> = {
  TODOS: "Todos",
  MORADOR: "Moradores",
  TURISTA: "Turistas",
};

// ─── Identidade visual ────────────────────────────────────────────────────────

export const BRAND = {
  name: "BC Todo Dia",
  tagline: "Balneário Camboriú o ano inteiro",
  colors: {
    ocean: "#0077B6",
    sand: "#F4A261",
    white: "#FFFFFF",
    dark: "#023E58",
  },
};
