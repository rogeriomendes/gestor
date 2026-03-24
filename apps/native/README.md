# FBI Gestor — app móvel (Expo)

Cliente **Expo Router** + **tRPC** + **Better Auth (Expo)** que fala com a mesma API que `apps/web`.

## Pré-requisitos

- Servidor web a correr (`pnpm dev:web` na raiz → porta **3001** por defeito).
- Ficheiro `apps/native/.env` com `EXPO_PUBLIC_SERVER_URL` (ver `.env.example`).

## Configuração

```bash
cd apps/native
cp .env.example .env
# Edita EXPO_PUBLIC_SERVER_URL conforme o alvo (simulador, emulador ou IP da máquina na LAN).
```

### Ligação ao backend

| Ambiente | URL típica |
|----------|------------|
| Simulador iOS | `http://127.0.0.1:3001` |
| Emulador Android | `http://10.0.2.2:3001` |
| Telefone na mesma Wi‑Fi | `http://<IP-do-PC>:3001` |

Se usares um host que não esteja em `trustedOrigins` do Better Auth (`packages/auth`), adiciona-o lá (ou via `CORS_ORIGIN` quando aplicável) para o login e cookies funcionarem.

O scheme de deep link é **`gestor`** (`app.json`), já incluído em `trustedOrigins` como `gestor://`.

## Comandos

Na raiz do monorepo:

```bash
pnpm dev:native
```

Ou dentro de `apps/native`:

```bash
pnpm dev      # expo start --clear
pnpm android  # build/run Android
pnpm ios      # build/run iOS
```

## Fluxo da app

1. `app/index.tsx` — redireciona para `/(drawer)` ou `/login` consoante a sessão.
2. `app/login.tsx` — e-mail/palavra-passe (e registo, alinhado à web).
3. `app/(drawer)/` — protegido: sem sessão, redireciona para `/login`.
4. **Início** — estado da API (`healthCheck`) e resumo do tenant (`tenant.getMyTenant`).

## TypeScript

O ficheiro `types/rn-uniwind-classname.d.ts` permite correr `tsc` sem depender do `uniwind-types.d.ts` gerado pelo Metro (que está no `.gitignore`). Ao desenvolver, o Metro continua a gerar tipos locais se configurado.

## Metro no Windows

A configuração do Metro está em **`metro.config.cjs`** (CommonJS). Isto evita o erro `ERR_UNSUPPORTED_ESM_URL_SCHEME` / `Received protocol 'c:'`, que ocorre quando o Node tenta carregar `metro.config.js` como ESM com um caminho absoluto Windows. O pacote `native` usa `"type": "commonjs"` para não herdar `"type": "module"` da raiz do monorepo.
