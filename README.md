# Grupo Natal Solidário

Portal e sistema de gestão do [Grupo Natal Solidário](https://www.instagram.com/grupo_natal_solidario/).

- **Portal público** (`/`): notícias, campanhas, transparência, voluntariado. *(em construção)*
- **Área administrativa** (`/admin`): usuários e perfis, auditoria e, nos próximos subprojetos, financeiro, estoque, patrimônio e comunidade.

Especificações e planos ficam em [`docs/superpowers/`](docs/superpowers/).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `web/` | App Next.js 16 (portal + admin), Tailwind e shadcn/ui |
| `functions/` | Cloud Functions (operações sensíveis: usuários, auditoria) |
| `firebase/` | Regras do Firestore e do Storage, índices e seus testes |
| `shared/` | Código compartilhado: perfis e matriz de permissões |
| `scripts/` | Scripts operacionais (criar o primeiro administrador) |

## Requisitos

- Node.js 22 ou superior
- Java 21 ou superior (emuladores do Firebase)
- Firebase CLI (`npm install -g firebase-tools`)

## Rodando localmente

```bash
npm install
npm run build -w functions
npm run emuladores            # terminal 1: Auth, Firestore, Functions, Storage (UI em http://localhost:4000)
cp web/.env.example web/.env.local
npm run dev -w web            # terminal 2: http://localhost:3000
```

Para entrar no admin local, crie o primeiro administrador nos emuladores (veja abaixo) e abra o link impresso para definir a senha.

## Testes

```bash
npm test                      # unitários + regras + functions (sobe os emuladores sozinho)
npm run test:e2e -w web       # ponta a ponta com Playwright (sobe emuladores e o Next)
npm run lint -w web
```

## Primeiro administrador

Rodar uma única vez por ambiente:

```bash
# Emuladores (com `npm run emuladores` rodando)
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npm run criar-admin -w @natal/scripts -- --projeto demo-natal-solidario --email voce@exemplo.com --nome "Seu Nome"

# Produção (requer `gcloud auth application-default login`)
npm run criar-admin -w @natal/scripts -- --projeto grupo-natal-solidario --email voce@exemplo.com --nome "Seu Nome"
```

Depois disso, novos usuários são convidados pela tela **Usuários** do admin.

## Publicação

O projeto Firebase de produção é `grupo-natal-solidario` (alias `prod`). O padrão do `.firebaserc` é o projeto de demonstração dos emuladores, para evitar deploys acidentais.

```bash
firebase deploy --only firestore,storage,functions --project prod
```

O app web é publicado pelo **Firebase App Hosting**, ligado a este repositório do GitHub com *root directory* `web` (configuração em `web/apphosting.yaml`).
