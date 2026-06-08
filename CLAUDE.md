# BC Todo Dia — CLAUDE.md

Plataforma web de economia local para Balneário Camboriú (SC).
Conecta comerciantes, moradores e turistas o ano inteiro.

## Stack
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Prisma 7** + **SQLite** (dev) via libsql adapter (`@prisma/adapter-libsql`)
- **NextAuth v4** (JWT strategy, Credentials + Google)
- **Zod** para validação de inputs em API Routes

## Rodar o projeto
```bash
cd C:/Users/trlpa/OneDrive/Desktop/Projetos/bc-todo-dia
npm run dev          # http://localhost:3000
```

## Banco de dados
```bash
npx prisma migrate dev --name descricao   # nova migration
npx prisma generate                        # regenerar client
npx prisma studio                          # GUI do banco
```

## Estrutura de diretórios
```
src/
  app/
    page.tsx                  # Landing page
    layout.tsx                # Root layout com Providers (NextAuth)
    api/
      auth/
        [...nextauth]/route.ts # NextAuth handler
        registro/route.ts      # POST /api/auth/registro
  lib/
    prisma.ts                 # Singleton PrismaClient (libsql adapter)
    auth.ts                   # NextAuthOptions (authOptions)
    constants.ts              # Labels/ícones de enums — FONTE ÚNICA
  types/
    next-auth.d.ts            # Extensão de tipos do NextAuth
  components/
    Providers.tsx             # SessionProvider wrapper
prisma/
  schema.prisma               # Schema (User, Business, Offer, Favorite)
  dev.db                      # SQLite local (não commitar)
```

## Modelos (schema.prisma)
| Modelo | Campos principais |
|--------|-------------------|
| User | id, name, email, password (bcrypt), role, bairro, consentAcceptedAt |
| Business | id, ownerId, name, slug, category, bairro, description, address, imageUrl, lat, lng, status, hours |
| Offer | id, businessId, title, description, discount, target, status, startsAt, endsAt |
| Favorite | id, userId, businessId (unique composto) |

## Enums — sempre importar de @prisma/client
- `UserRole`: COMERCIANTE | MORADOR | TURISTA
- `BusinessCategory`: RESTAURANTES | BARES_BALADAS | LOJAS_MODA | BELEZA_ESTETICA | HOSPEDAGEM | ESPORTES_AVENTURA | CULTURA_ARTE | SERVICOS_LOCAIS
- `Bairro`: CENTRO | BARRA_SUL | INTERPRAIAS | MUNICAO | ARQUIPELAGO | CANTO_DO_MORCEGO | PRAIA_LARANJEIRAS | PRAIA_DOS_AMORES | PIONEIROS | OUTRO
- `OfferTarget`: TODOS | MORADOR | TURISTA
- `BusinessStatus`: PENDENTE | ATIVO | SUSPENSO
- `OfferStatus`: RASCUNHO | ATIVA | EXPIRADA | CANCELADA

## Identidade visual
- Azul oceano: `#0077B6` (primária)
- Areia: `#F4A261` (destaque/CTA)
- Azul escuro: `#023E58` (textos, footer)
- Mobile-first, sem dark mode

## Variáveis de ambiente (.env)
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
```

## Módulo Restaurantes — API Routes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/restaurantes?q=camarao&bairro=CENTRO` | Lista pública + busca por prato |
| POST | `/api/restaurantes` | Cadastrar restaurante (COMERCIANTE) |
| GET | `/api/restaurantes/meus` | Restaurantes do comerciante logado |
| GET/PUT | `/api/restaurantes/[id]` | Detalhes ou editar (dono) |
| GET/POST | `/api/restaurantes/[id]/midias` | Listar/fazer upload foto ou vídeo |
| DELETE/PATCH | `/api/restaurantes/[id]/midias/[mediaId]` | Deletar ou definir como capa |
| GET/POST | `/api/restaurantes/[id]/cardapio/categorias` | Categorias do cardápio |
| GET/POST | `/api/restaurantes/[id]/cardapio/items` | Itens do cardápio |
| PUT/DELETE | `/api/restaurantes/[id]/cardapio/items/[itemId]` | Editar/remover item |
| GET/POST | `/api/restaurantes/[id]/promocoes` | Promoções (lista/criar) |
| PUT/DELETE | `/api/restaurantes/[id]/promocoes/[pid]` | Editar/cancelar promoção |
| POST | `/api/restaurantes/[id]/promocoes/[pid]/reativar` | Reativar promoção expirada |
| GET | `/api/promocoes?target=MORADOR&bairro=CENTRO` | Promoções ATIVAS hoje (público) |

## Páginas públicas

| Rota | Descrição |
|------|-----------|
| `/restaurantes` | Lista com busca por prato ("camarão", "pizza"...) |
| `/restaurante/[slug]` | Perfil completo: promoções, cardápio, fotos, vídeos, mapa |
| `/promocoes` | Feed de promoções ativas agora em BC |

## Dashboard do comerciante

| Rota | Descrição |
|------|-----------|
| `/dashboard/comerciante` | Visão geral |
| `/dashboard/comerciante/restaurante` | Editar perfil do restaurante |
| `/dashboard/comerciante/cardapio` | Gerenciar pratos e categorias |
| `/dashboard/comerciante/midias` | Upload/gestão de fotos e vídeos |
| `/dashboard/comerciante/promocoes` | Criar, editar e reativar promoções |

## Upload de arquivos
- Armazenamento: `/public/uploads/[slug]/fotos/` e `/public/uploads/[slug]/videos/`
- Fotos: máx 5MB, tipos: JPEG, PNG, WebP
- Vídeos: máx 50MB, tipos: MP4, WebM, QuickTime
- Máx 20 mídias por restaurante
- Em produção: trocar `src/lib/upload.ts` por Vercel Blob ou Cloudinary

## Promoções — regras de negócio
- `status` calculado automaticamente: ATIVA (dentro do período), RASCUNHO (início futuro), EXPIRADA (endsAt < agora)
- A API `/api/promocoes` só retorna promoções com `status=ATIVA AND startsAt<=agora AND endsAt>=agora`
- Expiração automática: ao chamar GET /api/restaurantes/[id]/promocoes, as expiradas são marcadas no banco
- Reativação: POST `/reativar` com novas datas, incrementa `reativacoesCount`
- Aviso legal exibido em toda tela pública de promoções

## Busca por prato
- `GET /api/restaurantes?q=camarao` busca em: `MenuItem.name`, `MenuItem.tags`, `MenuItem.description`
- `MenuItem.tags` é JSON array de strings: `["camarao", "frutos do mar", "sem gluten"]`
- Comerciante define tags ao criar/editar item no cardápio
- Busca é case-insensitive LIKE (SQLite)

## Regras de código neste projeto
- `constants.ts` é a fonte única de labels/ícones — nunca duplicar em componentes
- Senhas: bcrypt com work factor 12 (aplicado no registro)
- API Routes: validar com Zod antes de qualquer acesso ao banco
- LGPD: `consentAcceptedAt` + `consentVersion` obrigatórios no cadastro
- Nunca expor senha ou token em resposta de API
- `slug` de Business: gerado a partir do nome (slugify) — único no banco
