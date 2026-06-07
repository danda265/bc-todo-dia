"use client";

/**
 * ReviewSection
 * ─────────────
 * Seção de avaliações de clientes para a página do restaurante.
 *
 * Segurança:
 *  - Avaliação exige login (preferencial Google para badge anti-falso)
 *  - 1 avaliação por usuário por negócio
 *  - Rate limit aplicado no servidor (3/hora por IP)
 *  - Email do avaliador nunca exibido
 *  - Usuário pode editar ou deletar a própria avaliação (LGPD Art. 18)
 */

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

type ReviewUser = { name: string | null; image: string | null };
type Review = {
  id: string;
  rating: number;
  comment: string | null;
  providerUsed: string | null;
  createdAt: string;
  user: ReviewUser;
};

type Stats = {
  media: number | null;
  total: number;
  distribuicao: Record<number, number>;
};

type Props = { businessId: string; businessSlug: string };

export default function ReviewSection({ businessId, businessSlug }: Props) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ media: null, total: 0, distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Formulário
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [comment, setComment] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Estado da avaliação própria
  const [minhaReview, setMinhaReview] = useState<Review | null>(null);
  const [editando, setEditando] = useState(false);

  // ── Carregar avaliações ────────────────────────────────────────────
  async function carregar(p = 1) {
    setLoading(true);
    const r = await fetch(`/api/restaurantes/${businessId}/reviews?page=${p}`);
    const d = await r.json();
    setReviews(d.reviews ?? []);
    setStats({ media: d.media, total: d.total, distribuicao: d.distribuicao ?? {} });
    setPage(d.page ?? 1);
    setTotalPages(d.totalPages ?? 1);

    // Identificar review do usuário logado
    if (session?.user) {
      const minha = (d.reviews ?? []).find((rv: Review) =>
        rv.user?.name === session.user.name
      );
      if (minha) setMinhaReview(minha);
    }
    setLoading(false);
  }

  useEffect(() => { carregar(1); }, [businessId, session]);

  // ── Enviar avaliação ───────────────────────────────────────────────
  async function enviar() {
    if (rating === 0) { setErro("Escolha uma nota de 1 a 5 estrelas"); return; }
    if (comment.trim() && comment.trim().length < 10) {
      setErro("O comentário deve ter pelo menos 10 caracteres"); return;
    }
    setEnviando(true); setErro(""); setSucesso("");

    const r = await fetch(`/api/restaurantes/${businessId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() || null }),
    });
    const d = await r.json();

    if (!r.ok) {
      setErro(d.error ?? "Erro ao enviar avaliação");
    } else {
      setSucesso("Avaliação publicada! Obrigado pelo feedback.");
      setRating(0); setComment("");
      carregar(1);
    }
    setEnviando(false);
  }

  // ── Editar avaliação ───────────────────────────────────────────────
  async function salvarEdicao() {
    if (!minhaReview || rating === 0) return;
    setEnviando(true); setErro("");

    const r = await fetch(`/api/restaurantes/${businessId}/reviews/${minhaReview.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() || null }),
    });
    const d = await r.json();

    if (!r.ok) {
      setErro(d.error ?? "Erro ao editar");
    } else {
      setSucesso("Avaliação atualizada!");
      setEditando(false);
      carregar(1);
    }
    setEnviando(false);
  }

  // ── Deletar avaliação ──────────────────────────────────────────────
  async function deletar(reviewId: string) {
    if (!confirm("Deletar esta avaliação? A ação não pode ser desfeita.")) return;
    await fetch(`/api/restaurantes/${businessId}/reviews/${reviewId}`, { method: "DELETE" });
    setMinhaReview(null);
    carregar(1);
  }

  const iniciarEdicao = () => {
    if (!minhaReview) return;
    setRating(minhaReview.rating);
    setComment(minhaReview.comment ?? "");
    setEditando(true);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Resumo de avaliações */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-6">
            {/* Nota geral */}
            <div className="text-center flex-shrink-0">
              <div className="text-5xl font-bold text-[#023E58]">
                {stats.media?.toFixed(1)}
              </div>
              <StarRow rating={stats.media ?? 0} size="sm" readonly />
              <div className="text-xs text-gray-400 mt-1">{stats.total} avaliações</div>
            </div>

            {/* Barras de distribuição */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = stats.distribuicao[n] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-4 text-right">{n}</span>
                    <span className="text-amber-400">★</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-400 w-5">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Formulário de avaliação */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-[#023E58] mb-4">
          {minhaReview && !editando ? "Sua avaliação" : "Avaliar este restaurante"}
        </h3>

        {/* Avaliação já enviada (modo visualização) */}
        {minhaReview && !editando ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <StarRow rating={minhaReview.rating} size="md" readonly />
              <div className="flex gap-2">
                <button
                  onClick={iniciarEdicao}
                  className="text-xs text-[#0077B6] hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => deletar(minhaReview.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Deletar
                </button>
              </div>
            </div>
            {minhaReview.comment && (
              <p className="text-sm text-gray-600">{minhaReview.comment}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Publicada em {new Date(minhaReview.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ) : !session ? (
          /* Não logado */
          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-sm text-gray-500 mb-4">
              Entre com sua conta Google para avaliar.<br />
              Isso garante avaliações autênticas — sem falsos testemunhos.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: `/restaurante/${businessSlug}#avaliacoes` })}
              className="flex items-center gap-2 mx-auto bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <GoogleIcon /> Entrar com Google para avaliar
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Ou{" "}
              <a href="/entrar" className="text-[#0077B6] hover:underline">
                entre com email e senha
              </a>
            </p>
          </div>
        ) : (
          /* Formulário */
          <div className="space-y-4">
            {sucesso && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                ✅ {sucesso}
              </div>
            )}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                ⚠️ {erro}
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-2 block font-medium">
                Sua nota *
              </label>
              <StarRow
                rating={rating}
                hoverRating={ratingHover}
                size="lg"
                onHover={setRatingHover}
                onClick={setRating}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">
                Comentário (opcional, mín. 10 chars)
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Conte sobre sua experiência — pratos, atendimento, ambiente..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6] resize-none"
              />
              <div className="text-xs text-gray-400 text-right mt-1">{comment.length}/1000</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={editando ? salvarEdicao : enviar}
                disabled={enviando || rating === 0}
                className="bg-[#0077B6] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors"
              >
                {enviando ? "Enviando..." : editando ? "Salvar alterações" : "Publicar avaliação"}
              </button>
              {editando && (
                <button
                  onClick={() => { setEditando(false); setRating(0); setComment(""); }}
                  className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400">
              🔒 Avaliações são vinculadas à sua conta para garantir autenticidade.
              Sua avaliação pode ser deletada por você a qualquer momento (LGPD Art. 18).
            </p>
          </div>
        )}
      </div>

      {/* Lista de avaliações */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Carregando avaliações...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Nenhuma avaliação ainda. Seja o primeiro a avaliar!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rv) => (
            <ReviewCard
              key={rv.id}
              review={rv}
              isOwn={rv.id === minhaReview?.id}
              onDelete={() => deletar(rv.id)}
            />
          ))}

          {totalPages > 1 && (
            <div className="flex gap-2 justify-center pt-2">
              <button
                disabled={page <= 1}
                onClick={() => carregar(page - 1)}
                className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => carregar(page + 1)}
                className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ReviewCard({
  review, isOwn, onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${isOwn ? "border-[#0077B6]/30 bg-blue-50/30" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.user.image ? (
            <img
              src={review.user.image}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0077B6] flex items-center justify-center text-white font-semibold text-sm">
              {review.user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#023E58] text-sm">
                {review.user.name ?? "Usuário"}
              </span>
              {review.providerUsed === "google" && (
                <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                  <GoogleIconMini /> Google
                </span>
              )}
              {isOwn && (
                <span className="text-xs bg-[#0077B6]/10 text-[#0077B6] px-2 py-0.5 rounded-full">
                  Sua avaliação
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("pt-BR")}
              </span>
              {isOwn && (
                <button
                  onClick={onDelete}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  title="Deletar avaliação"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <StarRow rating={review.rating} size="sm" readonly />

          {review.comment && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StarRow — componente de estrelas interativo ou readonly ──────────────────

function StarRow({
  rating, hoverRating = 0, size = "md", readonly = false,
  onClick, onHover,
}: {
  rating: number;
  hoverRating?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  onClick?: (n: number) => void;
  onHover?: (n: number) => void;
}) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl" };
  const active = hoverRating || rating;

  return (
    <div
      className={`flex gap-0.5 ${sizes[size]}`}
      onMouseLeave={() => !readonly && onHover?.(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onClick?.(n)}
          onMouseEnter={() => !readonly && onHover?.(n)}
          className={`transition-colors duration-100 ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          } ${n <= active ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function GoogleIconMini() {
  return (
    <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
