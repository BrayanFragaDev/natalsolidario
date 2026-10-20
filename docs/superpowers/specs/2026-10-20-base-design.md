# Natal Solidário — Subprojeto 1: Base (design)

- **Data:** 2026-10-20
- **Status:** aguardando revisão
- **Escopo deste documento:** visão geral do sistema, decisões transversais e o design detalhado do subprojeto 1 (Base). Os subprojetos 2 a 6 terão especificações próprias.

## 1. Contexto e objetivo

O Grupo Natal Solidário é uma ONG que hoje se comunica principalmente pelo Instagram (`@grupo_natal_solidario`). O sistema terá duas frentes:

1. **Portal público**, para dar credibilidade e transparência, captar doações e voluntários, divulgar campanhas e eventos e manter um arquivo próprio de notícias.
2. **Área administrativa**, para a diretoria fazer a gestão interna: notícias, voluntários, financeiro, estoque, patrimônio e comunidade.

Quem publica e opera o sistema são voluntários sem perfil técnico, muitas vezes pelo celular. A interface precisa ser simples, responsiva e em português.

## 2. Decomposição em subprojetos

| Ordem | # | Subprojeto | Conteúdo | Depende de |
|---|---|---|---|---|
| 1º | 1 | Base | Login, perfis e permissões, gestão de usuários, auditoria, layout do admin | — |
| 2º | 2 | Portal público + Voluntários | Notícias, campanhas e eventos, "Como doar" (Pix e pontos de coleta), transparência, formulário de voluntário e gestão de voluntários no admin | 1 |
| 3º | 4 | Financeiro | Contas a pagar e a receber, caixa, categorias, relatórios, dados para a transparência | 1 |
| 4º | 5 | Estoque | Materiais, entradas e saídas, saldo, origem e destino | 1 |
| 5º | 3 | Comunidade | Autocadastro de membros, avisos de eventos e sorteios, notificações push e e-mail | 1, 2 |
| 6º | 6 | Patrimônio | Bens, responsável, localização, situação | 1 |

Cada subprojeto passa por especificação, plano, implementação e revisão próprios.

**Observação legal (subprojeto 3):** sorteios promovidos por entidades sem fins lucrativos podem depender de autorização governamental (Lei 5.768/71). O sistema apenas divulga sorteios e resultados; a regularidade legal é responsabilidade da diretoria.

## 3. Decisões transversais (valem para todos os subprojetos)

### 3.1 Stack

- **Next.js (App Router, versão estável atual) + TypeScript**, em uma única aplicação:
  - `/`: portal público, renderizado no servidor para SEO e prévias de links;
  - `/admin`: área administrativa, renderizada no cliente e protegida por login.
- **Tailwind CSS + shadcn/ui** para os componentes.
- **Firebase (plano Blaze, conta do mantenedor):** Authentication, Firestore, Storage, Cloud Functions (TypeScript), Cloud Messaging, App Check e App Hosting (hospedagem do Next.js).
- **Gerenciador de pacotes:** npm.

### 3.2 Segurança em camadas

1. **Interface:** esconde menus e ações sem permissão. É conveniência, não proteção.
2. **Regras do Firestore e do Storage:** proteção real de leitura e escrita.
3. **Cloud Functions:** operações sensíveis (perfis, lançamentos financeiros, movimentações de estoque, gravação na auditoria) acontecem só no servidor.

### 3.3 Ambientes

- **Local:** Firebase Emulator Suite. Nenhum desenvolvimento usa dados reais.
- **`natal-solidario-dev`:** homologação.
- **`natal-solidario-prod`:** produção.
- Nenhuma credencial vai para o repositório. A configuração pública do Firebase fica em variáveis de ambiente (`.env.local`, que não é versionado), e há um `.env.example` como modelo.

### 3.4 Governança da conta

- Os projetos são separados de outros projetos pessoais do mantenedor.
- Pelo menos um membro da diretoria é adicionado como **proprietário** do projeto de produção, para que a ONG nunca perca o acesso.
- Alertas de orçamento no Google Cloud (sugestão: R$ 20 e R$ 50 por mês), porque o plano Blaze não tem teto de gasto.

### 3.5 Estrutura do repositório

```
/
├── web/          # aplicação Next.js (portal + admin)
├── functions/    # Cloud Functions
├── firebase/     # firestore.rules, storage.rules, firestore.indexes.json
├── shared/       # código compartilhado (matriz de permissões, tipos)
├── scripts/      # scripts operacionais (ex.: criar primeiro admin)
├── docs/
└── firebase.json
```

### 3.6 Testes

- **Vitest:** regras de negócio e utilitários (`web/`, `functions/`, `shared/`).
- **@firebase/rules-unit-testing no emulador:** obrigatório para todas as regras do Firestore e do Storage.
- **Testes das Functions no emulador.**
- **Playwright:** fluxos ponta a ponta principais, contra os emuladores.

### 3.7 Convenções

- Código (identificadores) em português quando representar conceitos do domínio (`usuarios`, `perfis`, `lancamentos`). Termos técnicos permanecem em inglês.
- Datas gravadas como `Timestamp` do Firestore; exibidas no fuso `America/Sao_Paulo`.
- Valores monetários (subprojeto 4) em **centavos, como inteiros**.
- Nenhum documento de módulo crítico é apagado fisicamente: usa-se desativação ou estorno.

## 4. Subprojeto 1: Base

### 4.1 Perfis

| Código | Nome | Finalidade |
|---|---|---|
| `admin` | Administrador | Tudo, inclusive usuários e perfis |
| `diretoria` | Diretoria | Leitura de todos os módulos internos e aprovações |
| `tesouraria` | Tesouraria | Financeiro |
| `editor` | Editor | Notícias, campanhas, eventos, sorteios |
| `almoxarifado` | Almoxarifado | Estoque e patrimônio |
| `coord_voluntarios` | Coordenação de voluntários | Cadastro de voluntários |
| `membro` | Membro da comunidade | Aba Comunidade (público cadastrado) |

Um usuário pode ter vários perfis. `membro` não dá acesso a `/admin`.

### 4.2 Matriz de permissões

- Fica em `shared/permissoes.ts`, com permissões no formato `modulo:acao`.
- A Base implementa só as permissões dos seus próprios módulos. Cada subprojeto acrescenta as suas ao mesmo arquivo.

| Permissão | admin | diretoria |
|---|---|---|
| `admin:acessar` (entrar em `/admin`) | ✔ | ✔ |
| `usuarios:ver` | ✔ | ✔ |
| `usuarios:gerenciar` (convidar, perfis, desativar) | ✔ | — |
| `auditoria:ver` | ✔ | ✔ |

- Os perfis `tesouraria`, `editor`, `almoxarifado` e `coord_voluntarios` também recebem `admin:acessar`.
- `membro` não recebe nenhuma permissão administrativa.

A matriz expõe:

```ts
export type Perfil = 'admin' | 'diretoria' | 'tesouraria' | 'editor'
  | 'almoxarifado' | 'coord_voluntarios' | 'membro';
export function temPermissao(perfis: Perfil[], permissao: Permissao): boolean;
```

As regras do Firestore não importam TypeScript, então reproduzem a lógica com funções auxiliares (`temPerfil('admin')` etc.). Um teste automatizado percorre a matriz e verifica, contra o emulador, que cada perfil consegue ou não consegue cada operação, conforme a matriz.

### 4.3 Modelo de dados

**`usuarios/{uid}`**

| Campo | Tipo | Observação |
|---|---|---|
| `nome` | string | obrigatório |
| `email` | string | obrigatório, igual ao do Auth |
| `telefone` | string \| null | opcional |
| `perfis` | Perfil[] | espelho dos custom claims |
| `ativo` | boolean | |
| `criadoEm` | Timestamp | |
| `criadoPor` | string (uid) \| null | `null` para o primeiro admin |
| `atualizadoEm` | Timestamp | |

- **Leitura:** o próprio usuário, ou quem tem `usuarios:ver`.
- **Escrita direta pelo cliente:** só `nome` e `telefone` do próprio documento. Todo o resto é gravado pelas Functions.

**`auditoria/{id}`**

| Campo | Tipo |
|---|---|
| `atorUid` | string |
| `atorNome` | string |
| `acao` | string (ex.: `usuario.convidar`, `usuario.definirPerfis`) |
| `entidade` | string (ex.: `usuarios`) |
| `entidadeId` | string |
| `antes` | map \| null |
| `depois` | map \| null |
| `em` | Timestamp (servidor) |

- **Leitura:** quem tem `auditoria:ver`.
- **Escrita:** nenhuma pelo cliente; só pelas Functions (Admin SDK).

**Custom claims:** `{ perfis: Perfil[] }`.

### 4.4 Cloud Functions (callable)

Todas exigem login, App Check e `usuarios:gerenciar`. Todas validam a entrada com Zod e gravam na `auditoria`.

| Função | Entrada | Efeito |
|---|---|---|
| `convidarUsuario` | `{ nome, email, telefone?, perfis }` | Cria o usuário no Auth, define os claims, cria `usuarios/{uid}` e envia por e-mail o link para definir a senha. Erro `already-exists` se o e-mail já estiver cadastrado. |
| `definirPerfis` | `{ uid, perfis }` | Atualiza os claims e o documento, e revoga os refresh tokens para a mudança valer na hora. Impede que o último admin ativo remova o próprio perfil `admin`. |
| `desativarUsuario` | `{ uid }` | `disabled: true` no Auth, `ativo: false` no documento, tokens revogados. Impede desativar o último admin ativo. |
| `reativarUsuario` | `{ uid }` | Desfaz a desativação. |

- **Erros:** usam `HttpsError` com códigos padrão. A interface traduz cada código para uma mensagem em português.
- **Log técnico:** o detalhe vai para o Cloud Logging, sem dados pessoais além do uid.

**Envio do e-mail de convite:** o link de definição de senha é gerado com `generatePasswordResetLink` e enviado pela extensão oficial "Trigger Email" do Firebase, ligada a um provedor SMTP com plano gratuito (ex.: Brevo). Se o e-mail não estiver configurado (ambiente local), a função devolve o link para o admin copiar manualmente.

### 4.5 Primeiro administrador

O script `scripts/criar-primeiro-admin.ts` recebe o e-mail e o projeto de destino. Ele cria ou localiza o usuário, define `perfis: ['admin']` e cria o documento. Usa as credenciais do Firebase CLI de quem o executa e falha se já existir algum admin. É executado manualmente, uma vez por ambiente.

### 4.6 Interface do admin

- **`/admin/login`:** e-mail e senha, botão "Entrar com Google", "Esqueci minha senha".
  - O login com Google só é aceito para e-mails que já têm documento em `usuarios` e estão ativos. Caso contrário, a pessoa é deslogada e vê a mensagem "Acesso não autorizado".
  - O Firebase cria a conta no Auth mesmo assim, mas ela fica sem perfis e sem documento, e as regras não liberam nada para ela. Bloquear isso já na criação exigiria funções de bloqueio (Identity Platform), o que foi descartado por complexidade.
- **Proteção de rotas:** todo `/admin/*`, exceto o login, exige login e `admin:acessar`. Sem permissão, a pessoa é redirecionada para o login com aviso.
- **Layout:** menu lateral (em gaveta no celular) gerado a partir das permissões, cabeçalho com o nome do usuário e botão "Sair".
- **`/admin`** (painel): boas-vindas e atalhos para os módulos permitidos.
- **`/admin/usuarios`:** tabela com busca por nome ou e-mail e filtro por perfil e situação.
  - Ações: "Convidar", "Editar perfis", "Desativar" e "Reativar".
  - Ações destrutivas pedem confirmação.
- **`/admin/auditoria`:** lista paginada com filtros por pessoa, entidade e período. Ao abrir um item, mostra a diferença entre antes e depois.
- **`/admin/perfil`:** o próprio usuário edita nome e telefone e troca a senha.

### 4.7 Proteções adicionais

- **App Check:** reCAPTCHA Enterprise na web; token de depuração nos emuladores.
- **Sessão:** o estado de autenticação do Firebase fica no cliente. A troca de perfis vale na hora graças à revogação de tokens, e o cliente força a atualização do token quando recebe `permission-denied`.
- **LGPD:** coletar só o necessário. Telefone é opcional. Ninguém sem `usuarios:ver` vê dados de outros usuários.

### 4.8 Fora do escopo da Base

- Conteúdo do portal público: a Base entrega só uma página inicial provisória.
- Autocadastro de membros (subprojeto 3).
- Autenticação em dois fatores (avaliar quando o financeiro entrar).
- Domínio próprio: o endereço provisório do Firebase basta por enquanto.

### 4.9 Critérios de aceitação

1. Com o script, o primeiro admin é criado no ambiente dev e consegue entrar.
2. O admin convida um usuário, a pessoa recebe o link (por e-mail ou copiado manualmente no ambiente local), define a senha e entra.
3. Cada perfil vê no menu só o que a matriz permite. Os testes de regras provam que o banco recusa leituras e escritas fora da permissão em `usuarios` e `auditoria`.
4. Alterar perfis ou desativar alguém passa a valer na próxima ação da pessoa, sem precisar sair e entrar de novo.
5. Não é possível remover nem desativar o último admin ativo.
6. Toda ação das Functions aparece em `/admin/auditoria`, com o antes e o depois.
7. O login com Google de um e-mail não convidado é recusado.
8. Lint, testes unitários, testes de regras e testes ponta a ponta passam. A aplicação está publicada no App Hosting do projeto dev.

### 4.10 Riscos e pontos em aberto

- **Custo do Blaze:** mitigado por alertas de orçamento e pela cota gratuita. Revisar após o primeiro mês em produção.
- **Provedor de e-mail:** precisa de uma conta SMTP gratuita, a ser criada pelo mantenedor. Até lá vale o fallback do link manual.
- **Dependência de uma única pessoa (mantenedor):** mitigada pela seção 3.4 e pela documentação no `README` e no `CLAUDE.md`.
