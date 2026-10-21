# Subprojeto 2 (Portal público + Voluntários): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o portal público (início, publicações, como doar, voluntário, transparência, sobre) e os módulos do admin (Publicações, Voluntários, Transparência, Portal) em gruponatalsolidario.web.app.

**Architecture:**
- O portal usa Server Components que leem o Firestore com `firebase-admin`, com `'use cache'` e `cacheLife` de 300 s.
- O admin, client-side como na Base, grava publicações, documentos e configs direto, protegido pelas regras.
- Inscrição de voluntário, alterações de voluntário e Pix passam por Cloud Functions com auditoria.
- Os arquivos vão para o Storage, com regras que leem `usuarios/{uid}` no banco `natalsolidario`.

**Tech Stack:** o da Base (Next.js 16.4, Firebase, Zod, Vitest, Playwright), mais:
- `sanitize-html` e `@types/sanitize-html`;
- `@tiptap/react`, `@tiptap/starter-kit` e `@tiptap/extension-link`;
- `qrcode` e `@types/qrcode`;
- `server-only`.

**Spec:** `docs/superpowers/specs/2026-10-21-portal-voluntarios-design.md`. Ver também `docs/superpowers/specs/2026-10-20-base-design.md` (seção 3).

## Global Constraints

- **Permissões:** valem exatamente as da spec, seção 4. Toda permissão nova entra em `shared/src/permissoes.ts` **e** em `firebase/firestore.rules` (e `storage.rules` quando houver arquivo), com teste.
- **Banco:** `natalsolidario` em todos os ambientes, inclusive nos emuladores (Tarefa 1).
- **Cores:**
  - vermelho `#B3202A`;
  - verde `#1F5135`;
  - dourado `#D4A24C`;
  - creme `#FBF7F0`;
  - texto `#22201C`.
- **Fontes:** Fraunces nos títulos, Geist no corpo.
- **Limites:**
  - título 3–140, resumo ≤ 280, galeria ≤ 20;
  - imagem de publicação ≤ 5 MB, PDF ≤ 20 MB, logo ≤ 1 MB;
  - números ≤ 4, necessidades ≤ 30, pontos de coleta ≤ 20;
  - anotações ≤ 2000, observações ≤ 500;
  - nome do recebedor do Pix ≤ 25, cidade ≤ 15.
- **Texto de consentimento**, exato: "Autorizo o Grupo Natal Solidário a usar estes dados para entrar em contato sobre ações voluntárias, conforme a LGPD."
- **Escrita:** nenhuma coleção nova aceita `delete` de cliente, exceto rascunhos de `publicacoes` com `publicadoEm == null`.
- **Textos de interface:** em pt-BR. Datas exibidas em `America/Sao_Paulo`.
- **Commits:** terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Fluxo:** trabalhar na branch `feat/portal`. Deploy só com autorização do mantenedor (Tarefa 12).

## Review Focus

1. **HTML malicioso colado no editor** (`<img onerror>`, `<a href="javascript:">`, `<iframe>`): nada executa no portal. Testado em `sanitizarHtml` (Tarefa 6).
2. **Campanha sem meta, com meta `atual > alvo` ou com `alvo` 0:** a barra de progresso não quebra; fica limitada a 100% e não aparece sem meta. Teste de `progressoCampanha` (Tarefa 7).
3. **Fuso horário na virada do dia:** um evento às 23h de São Paulo continua "próximo" até começar, e uma campanha que termina hoje continua ativa o dia inteiro. Testes de `eventoEhFuturo` e `campanhaAtiva` (Tarefa 7).
4. **WhatsApp com máscara ou com 55 na frente** (`(11) 98765-4321`, `+55 11 98765-4321`): é normalizado para `11987654321`, e o bloqueio de 24 h reconhece o mesmo número. Teste em `inscreverVoluntario` (Tarefa 4).
5. **Nome do recebedor do Pix com acento e com mais de 25 caracteres** ("Associação Natal Solidário de São Paulo"): o payload remove os acentos e corta em 25, e o CRC continua válido. Teste em `gerarPayloadPix` (Tarefa 2).

---

### Task 1: Emuladores no banco `natalsolidario`

**Files:**
- Create: `functions/.env.demo-natal-solidario` (`FIRESTORE_DATABASE=natalsolidario`)
- Modify:
  - `functions/vitest.config.ts`: `test.env.FIRESTORE_DATABASE = 'natalsolidario'`;
  - `functions/test/apoio.ts`: `limparFirestore` usa `databases/natalsolidario`;
  - `scripts/test/criar-primeiro-admin.test.ts`: `getFirestore(app, 'natalsolidario')` e limpeza do mesmo banco;
  - `web/e2e/semente.ts`: `getFirestore(app, 'natalsolidario')` e limpeza do mesmo banco;
  - `web/playwright.config.ts`, em `webServer.env`: `NEXT_PUBLIC_FIRESTORE_DATABASE: 'natalsolidario'`, `FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080'`, `FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099'`, `FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199'`, `GCLOUD_PROJECT: 'demo-natal-solidario'`, `PORTAL_SEM_CACHE: 'true'`;
  - `web/.env.example`: documentar `NEXT_PUBLIC_FIRESTORE_DATABASE=natalsolidario` para os emuladores;
  - `README.md`: comandos locais com o banco.

**Interfaces:**
- Produces: todos os testes contra emulador usam o banco `natalsolidario`, ao qual o `firebase.json` aplica as regras.

- [ ] **Step 1:** Fazer as alterações acima.
- [ ] **Step 2:** `npm test` → os 128 testes passam.
- [ ] **Step 3:** `npm run test:e2e -w web` → 5 passam (agora com as regras aplicadas).
- [ ] **Step 4:** Commit: `test: emuladores usam o banco natalsolidario`

### Task 2: Shared: permissões, Pix, slug e constantes do voluntário

**Files:**
- Modify: `shared/src/permissoes.ts`, `shared/src/index.ts`
- Create: `shared/src/pix.ts`, `shared/src/slug.ts`, `shared/src/voluntario.ts`
- Test: `shared/test/permissoes.test.ts` (ampliar), `shared/test/pix.test.ts`, `shared/test/slug.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // permissoes.ts — Permissao ganha:
  'publicacoes:editar' | 'doacoes:editar' | 'voluntarios:ver' | 'voluntarios:gerenciar' | 'transparencia:editar' | 'portal:configurar'
  // pix.ts
  export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  export function validarChavePix(tipo: TipoChavePix, chave: string): boolean;
  export function normalizarChavePix(tipo: TipoChavePix, chave: string): string; // cpf/cnpj só dígitos; telefone '+55DDDNUMERO'; email minúsculo; aleatória minúscula
  export function gerarPayloadPix(d: { chave: string; nomeRecebedor: string; cidade: string; txid?: string }): string;
  // slug.ts
  export function gerarSlug(titulo: string): string;          // minúsculas, sem acentos, [a-z0-9-], hífens únicos, sem hífen nas pontas, ≤ 80
  export function slugComSufixo(base: string, n: number): string; // n ≥ 2 → `${base}-${n}` (base cortada para caber em 80)
  // voluntario.ts
  export const AJUDAS: readonly { valor: 'arrecadacao'|'triagem'|'entregas'|'eventos'|'divulgacao'|'outro'; rotulo: string }[];
  export const DIAS: readonly { valor: 'seg'|'ter'|'qua'|'qui'|'sex'|'sab'|'dom'; rotulo: string }[];
  export const TURNOS: readonly { valor: 'manha'|'tarde'|'noite'; rotulo: string }[];
  export const STATUS_VOLUNTARIO: readonly { valor: 'novo'|'ativo'|'inativo'; rotulo: string }[];
  export const TEXTO_CONSENTIMENTO: string; // texto exato das Global Constraints
  export function normalizarWhatsapp(entrada: string): string | null; // remove não dígitos; remove prefixo 55 se sobrarem 12–13 dígitos; válido só com 10–11
  ```
- Rótulos das ajudas: "Arrecadação", "Triagem e embalagem", "Entregas", "Eventos", "Divulgação e redes sociais", "Outro".
- **Algoritmo do Pix:**
  - campos EMV `ID + tamanho (2 dígitos) + valor`, nesta ordem:
    - `00`=`01`;
    - `26`=[`00`=`BR.GOV.BCB.PIX`, `01`=chave];
    - `52`=`0000`; `53`=`986`; `58`=`BR`;
    - `59`=nome; `60`=cidade;
    - `62`=[`05`=txid ou `***`];
    - `63`=CRC;
  - nome e cidade sem acentos (NFD sem diacríticos), cortados em 25 e 15;
  - CRC16-CCITT-FALSE (polinômio `0x1021`, início `0xFFFF`), calculado sobre o payload + `6304`, em hexadecimal maiúsculo com 4 dígitos.

- [ ] **Step 1: Escrever os testes**
  - **Permissões:** a matriz da spec 4. Por exemplo:
    - `temPermissao(['editor'],'publicacoes:editar')` e `temPermissao(['editor'],'doacoes:editar')` são true; `temPermissao(['editor'],'voluntarios:ver')` é false;
    - `diretoria` tem `voluntarios:ver` e `transparencia:editar`, mas não `voluntarios:gerenciar`;
    - `tesouraria` tem só `admin:acessar` e `transparencia:editar`;
    - `coord_voluntarios` tem `voluntarios:ver` e `voluntarios:gerenciar`;
    - só `admin` tem `portal:configurar`;
    - `almoxarifado` continua só com `admin:acessar`.
  - **Pix:**
    - `gerarPayloadPix({ chave: '123e4567-e12b-12d1-a456-426655440000', nomeRecebedor: 'Fulano de Tal', cidade: 'BRASILIA' })` deve ser igual a `'00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'` (exemplo do Manual do BR Code do BCB). Se divergir, confira o manual antes de mexer no teste;
    - nome `'Associação Natal Solidário de São Paulo'` vira `5925Associacao Natal Solidar` no payload, e os últimos 4 caracteres são o CRC recalculado de `payload.slice(0,-4)` (Review Focus 5);
    - `validarChavePix`:
      - `cpf`: `'529.982.247-25'` é true, `'111.111.111-11'` é false;
      - `cnpj`: `'11.222.333/0001-81'` é true, `'11.222.333/0001-80'` é false;
      - `email`: `'Doe@Ong.org'` é true, `'doe@'` é false;
      - `telefone`: `'+5511987654321'` e `'11987654321'` são true, `'1198765'` é false;
      - `aleatoria`: um UUID v4 é true, `'abc'` é false.
  - **Slug:**
    - `gerarSlug('Campanha de Natal 2026: Brinquedos!')` é `'campanha-de-natal-2026-brinquedos'`;
    - `gerarSlug('  Ação   Solidária  ')` é `'acao-solidaria'`;
    - um título com 200 caracteres gera slug com ≤ 80;
    - `slugComSufixo('abc', 2)` é `'abc-2'`.
  - **WhatsApp:** `normalizarWhatsapp('(11) 98765-4321')`, `normalizarWhatsapp('+55 11 98765-4321')` e `normalizarWhatsapp('5511987654321')` dão `'11987654321'`; `normalizarWhatsapp('123')` dá `null`.
- [ ] **Step 2:** `npm test -w shared` → FAIL
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w shared` → PASS
- [ ] **Step 5:** Commit: `feat(shared): permissões do portal, Pix, slug e constantes de voluntário`

### Task 3: Regras do Firestore e do Storage

**Files:**
- Modify:
  - `firebase/firestore.rules` (coleções `publicacoes`, `voluntarios`, `inscricoesRecentes`, `documentos`, `config/{doc}`);
  - `firebase/storage.rules`;
  - `firebase/firestore.indexes.json`.
- Test: `firebase/test/firestore.rules.test.ts` (ampliar), `firebase/test/portal.rules.test.ts`, `firebase/test/storage.rules.test.ts` (reescrever)

**Interfaces:**
- Consumes: `PERFIS`, `temPermissao` (Tarefa 2).
- **Regras:** conforme a spec 7.2 e 7.3.
- **Validação de `publicacoes`** no create e no update:
  - `titulo` string 3–140;
  - `resumo` ≤ 280;
  - `categoria` em `['noticia','campanha','evento']`;
  - `status` em `['rascunho','publicada']`;
  - `galeria.size() <= 20`;
  - se `resource.data.slugFixado == true`, então `request.resource.data.slug == resource.data.slug`.
- **Validação de `documentos`:**
  - `categoria` em `['prestacao_contas','relatorio_atividades','documentos_legais','outros']`;
  - `ano` int;
  - `arquivado` bool.
- **Regras do Storage:**
  - a função `perfisDe(uid)` usa `firestore.get(/databases/natalsolidario/documents/usuarios/$(uid)).data`, com checagem de `ativo == true`;
  - limites de tamanho e tipo conforme a spec 7.3.
- **Índices:**
  - `publicacoes(status, publicadoEm desc)`;
  - `publicacoes(status, categoria, publicadoEm desc)`;
  - `publicacoes(categoria, status, slug)`;
  - `documentos(arquivado, categoria, ano desc)`.

- [ ] **Step 1: Spike de risco.** Confirmar, num teste de Storage no emulador, que `firestore.get` com o banco `natalsolidario` funciona:
  - semear `usuarios/u1` (admin ativo) no banco `natalsolidario` via `firebase-admin` (`getFirestore(app,'natalsolidario')` com `FIRESTORE_EMULATOR_HOST`);
  - verificar que o upload de `portal/logo.png` (`image/png`, 10 KB) por `u1` é aceito.
  - **Se não funcionar**, PARAR e registrar Ruling: a alternativa da spec 12 (URL assinada via Function) vira uma tarefa nova antes da Tarefa 9.
- [ ] **Step 2: Escrever os testes**
  - **Leitura de publicações:**
    - anônimo lê `publicacoes/p1` com `status:'publicada'`;
    - anônimo **não** lê `p2` com `status:'rascunho'`;
    - editor lê `p2`.
  - **Escrita de publicações:**
    - editor cria publicação válida;
    - diretoria não cria;
    - editor não cria com `titulo:'ab'`;
    - editor não altera o `slug` quando `slugFixado:true`;
    - editor apaga rascunho com `publicadoEm:null`;
    - editor não apaga com `publicadoEm` preenchido.
  - **Voluntários:**
    - anônimo e editor não leem `voluntarios/v1`;
    - diretoria e coord_voluntarios leem;
    - ninguém escreve;
    - ninguém lê `inscricoesRecentes/x`.
  - **Documentos:**
    - anônimo lê documento com `arquivado:false` e não lê com `arquivado:true`;
    - tesouraria cria e altera `arquivado`;
    - editor não cria;
    - ninguém apaga.
  - **Configs:**
    - anônimo lê `config/portal`, `config/doacoes` e `config/pix`;
    - só admin grava `config/portal`;
    - editor grava `config/doacoes`;
    - ninguém grava `config/pix`.
  - **Storage:**
    - editor envia imagem de 1 MB em `publicacoes/p1/a.webp` e não envia 6 MB;
    - editor não envia PDF em `publicacoes/`;
    - tesouraria envia PDF de 1 MB em `transparencia/d1.pdf`;
    - editor não envia em `transparencia/`;
    - só admin envia em `portal/`;
    - anônimo lê os três caminhos e não escreve;
    - admin com `ativo:false` não envia.
- [ ] **Step 3:** `npm test -w @natal/firebase-rules` → FAIL
- [ ] **Step 4:** Implementar as regras e os índices.
- [ ] **Step 5:** `npm test -w @natal/firebase-rules` → PASS
- [ ] **Step 6:** Commit: `feat(regras): portal, voluntários, transparência e storage`

### Task 4: Function `inscreverVoluntario`

**Files:**
- Create: `functions/src/voluntarios/inscrever.ts`, `functions/src/voluntarios/esquemas.ts`
- Modify: `functions/src/index.ts`, `functions/src/lib/requisicao.ts` (opções para uma callable pública)
- Test: `functions/test/inscreverVoluntario.test.ts`

**Interfaces:**
- Consumes:
  - de `@natal/shared`: `AJUDAS`, `DIAS`, `TURNOS`, `TEXTO_CONSENTIMENTO`, `normalizarWhatsapp`;
  - de `lib/`: `registrarAuditoria`, `validar`, `esquemaNome`, `esquemaEmail`.
- Produces:
  - `inscrever(req: Requisicao): Promise<{ ok: true }>`, exportado como callable `inscreverVoluntario`;
  - `esquemas.ts` exporta `esquemaInscricao` (Zod) e `esquemaWhatsapp`.
- **Entrada:** `{ nome, whatsapp, email?, cidadeBairro, ajudas, veiculo?, dias, turnos, observacoes?, consentimento: true }`. `veiculo` só é obrigatório se `ajudas` incluir `entregas`; caso contrário, fica `null`.
- **Gravação:** em transação, conforme a spec 7.4. A auditoria usa o ator `{ uid: 'publico', nome: 'Formulário público' }` e `depois` sem anotações. `consentimento` = `{ em: serverTimestamp, texto: TEXTO_CONSENTIMENTO }`.
- **Sem autenticação:** não chamar `exigirPermissao`. Callable com `enforceAppCheck` como as demais.

- [ ] **Step 1: Escrever os testes**
  - Uma entrada válida cria 1 documento em `voluntarios` com `status:'novo'`, `whatsapp:'11987654321'` (vindo de `'(11) 98765-4321'`), `consentimento.texto === TEXTO_CONSENTIMENTO`; cria `inscricoesRecentes/11987654321`; e registra 1 auditoria `voluntario.inscrever`.
  - Segundo envio com `'+55 11 98765-4321'` em menos de 24 h: resolve `{ ok: true }` e o total em `voluntarios` continua 1 (Review Focus 4).
  - Com `inscricoesRecentes/11987654321.em` semeado há 25 h: cria o segundo cadastro.
  - Cada caso abaixo dá `invalid-argument`:
    - `consentimento:false`;
    - `ajudas:[]`;
    - `dias:['xyz']`;
    - `whatsapp:'123'`;
    - `ajudas:['entregas']` sem `veiculo`;
    - `observacoes` com 501 caracteres.
  - Sem `req.auth`, uma entrada válida funciona.
- [ ] **Step 2:** `npm test -w functions` → FAIL
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w functions` → PASS
- [ ] **Step 5:** Commit: `feat(functions): inscreverVoluntario`

### Task 5: Functions `atualizarVoluntario` e `definirPix`

**Files:**
- Create: `functions/src/voluntarios/atualizar.ts`, `functions/src/portal/definirPix.ts`
- Modify: `functions/src/index.ts`
- Test: `functions/test/atualizarVoluntario.test.ts`, `functions/test/definirPix.test.ts`

**Interfaces:**
- Consumes: `exigirPermissao`, `reconfirmarPermissao`, `registrarAuditoria`, `validar`; `validarChavePix` e `normalizarChavePix` (Tarefa 2).
- Produces:
  - `atualizar(req): Promise<{ ok: true }>`, exportado como callable `atualizarVoluntario`. Entrada: `{ id, status?: 'novo'|'ativo'|'inativo', anotacoes?: string|null (≤ 2000) }`; pelo menos um dos dois campos.
  - `definirPixHandler(req): Promise<{ ok: true }>`, exportado como callable `definirPix`. Entrada: `{ tipo, chave, nomeRecebedor (1–25), cidade (1–15) }`. Grava a chave normalizada.
- **Mensagens de chave inválida**, por tipo: "CPF inválido.", "CNPJ inválido.", "E-mail inválido.", "Telefone inválido. Use DDD e número.", "Chave aleatória inválida.".
- **Auditoria:** `voluntario.atualizar`, com antes e depois só dos campos alterados, e `pix.definir`, com antes e depois do documento.

- [ ] **Step 1: Escrever os testes**
  - **atualizar:**
    - coord_voluntarios muda o status para `ativo`: documento e auditoria conferem;
    - diretoria → `permission-denied`;
    - id inexistente → `not-found`;
    - `{ id }` sem campos → `invalid-argument`.
  - **definirPix:**
    - admin define o CPF `'529.982.247-25'`, que é gravado como `'52998224725'`, com auditoria `pix.definir`;
    - editor → `permission-denied`;
    - CNPJ inválido → `invalid-argument` com a mensagem "CNPJ inválido.";
    - nome com 26 caracteres → `invalid-argument`.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w functions` → PASS
- [ ] **Step 5:** Commit: `feat(functions): atualizarVoluntario e definirPix`

### Task 6: Base do web: tema, sanitização, imagem, upload e leitura no servidor

**Files:**
- Create:
  - `web/src/lib/sanitizar.ts`;
  - `web/src/lib/imagem.ts`;
  - `web/src/lib/upload.ts`;
  - `web/src/lib/servidor/admin.ts`;
  - `web/src/lib/servidor/portal.ts`;
  - `web/src/lib/tipos-portal.ts`.
- Modify:
  - `web/src/app/globals.css` (tokens `--natal-*` e classes de tema do portal);
  - `web/src/app/layout.tsx` (fonte Fraunces via `next/font/google`, variável `--font-titulo`);
  - `web/package.json` (dependências do cabeçalho do plano).
- Test: `web/src/lib/sanitizar.test.ts`, `web/src/lib/imagem.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // tipos-portal.ts — tipos de leitura (datas como Date)
  export interface Publicacao { id; titulo; slug; categoria: 'noticia'|'campanha'|'evento'; resumo; conteudoHtml; capa: Midia|null; galeria: Midia[]; status; publicadoEm: Date|null; evento: {inicio: Date; fim: Date|null; local: string; enderecoMaps: string|null}|null; campanha: {inicio: Date; fim: Date; meta: {descricao: string; alvo: number; atual: number}|null}|null }
  export interface Midia { url: string; caminho: string; alt: string }
  export interface Documento { id; titulo; ano: number; categoria: 'prestacao_contas'|'relatorio_atividades'|'documentos_legais'|'outros'; arquivo: {url; caminho; tamanho: number}; arquivado: boolean }
  export interface ConfigPortal { logo: {url; caminho}|null; frase; numeros: {rotulo; valor}[]; whatsapp; email; instagram; cnpj; sobreHtml }
  export interface ConfigDoacoes { necessidades: string[]; pontosColeta: {nome; endereco; horario; linkMaps: string|null}[] }
  export interface ConfigPix { tipo: TipoChavePix; chave; nomeRecebedor; cidade }
  // sanitizar.ts
  export function sanitizarHtml(html: string): string;
  // imagem.ts
  export function dimensoesReduzidas(largura: number, altura: number, ladoMaximo?: number): { largura: number; altura: number }; // ladoMaximo padrão 1600; nunca amplia
  export function reduzirImagem(arquivo: File, ladoMaximo?: number): Promise<Blob>; // canvas → image/webp 0.82, fallback image/jpeg
  // upload.ts (cliente)
  export function enviarArquivo(caminho: string, dados: Blob, tipo: string): Promise<{ url: string; caminho: string }>;
  // servidor/admin.ts ('server-only')
  export const dbServidor: Firestore; // getFirestore(app, process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || '(default)')
  // servidor/portal.ts ('server-only'; cada função com 'use cache' + cacheLife({ revalidate: process.env.PORTAL_SEM_CACHE === 'true' ? 0 : 300 }))
  export function listarPublicacoes(o: { categoria?: Publicacao['categoria']; pagina: number; porPagina: number }): Promise<{ itens: Publicacao[]; haMais: boolean }>;
  export function obterPublicacaoPorSlug(slug: string): Promise<Publicacao | null>;
  export function listarCampanhasAtivas(agora: Date): Promise<Publicacao[]>;
  export function listarProximosEventos(agora: Date, limite: number): Promise<Publicacao[]>;
  export function listarDocumentos(): Promise<Documento[]>;
  export function obterConfigPortal(): Promise<ConfigPortal | null>;
  export function obterConfigDoacoes(): Promise<ConfigDoacoes | null>;
  export function obterPix(): Promise<ConfigPix | null>;
  ```
- Antes de usar `'use cache'` e `cacheLife`, ler `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` e o guia de `cacheLife`. Datas passadas como argumento para função cacheada devem ser normalizadas para o dia (São Paulo), para não gerar uma chave de cache por milissegundo.
- `sanitize-html`:
  - `allowedTags: ['p','h2','h3','strong','em','ul','ol','li','a','blockquote','br']`;
  - `allowedAttributes: { a: ['href','target','rel'] }`;
  - `allowedSchemes: ['http','https','mailto']`;
  - `transformTags` acrescenta `rel="noopener noreferrer"` em `<a>`.

- [ ] **Step 1: Escrever os testes**
  - **sanitizarHtml** remove:
    - `<script>alert(1)</script>`;
    - `onerror` em `<img src=x onerror=alert(1)>` (a tag `img` some);
    - `href` com `javascript:alert(1)`;
    - `<iframe>`;
    - `style`.
  - **sanitizarHtml** mantém `<h2>`, listas e `<a href="https://x.org">`, com `rel="noopener noreferrer"` (Review Focus 1).
  - **dimensoesReduzidas:**
    - `(4000,3000)` → `{1600,1200}`;
    - `(1000,3000)` → `{533,1600}`;
    - `(800,600)` → `{800,600}`.
- [ ] **Step 2:** `npm test -w web` → FAIL
- [ ] **Step 3:** Implementar. As funções de servidor não têm teste unitário: são cobertas pelos E2E da Tarefa 11.
- [ ] **Step 4:** `npm test -w web && npm run lint -w web && npm run build -w web` → PASS
- [ ] **Step 5:** Commit: `feat(web): tema natalino, sanitização, imagens e leitura do portal no servidor`

### Task 7: Portal: layout, início, publicações e 404

**Files:**
- Create:
  - `web/src/app/(portal)/layout.tsx` (cabeçalho, rodapé, fundo creme);
  - `web/src/app/(portal)/page.tsx` (mover a página provisória atual de `web/src/app/page.tsx` para cá);
  - `web/src/app/(portal)/publicacoes/page.tsx`;
  - `web/src/app/(portal)/publicacoes/[slug]/page.tsx`;
  - `web/src/app/not-found.tsx`;
  - `web/src/components/portal/{cabecalho,rodape,cartao-publicacao,barra-progresso,compartilhar}.tsx`;
  - `web/src/lib/portal-datas.ts`;
  - `web/public/og-padrao.png` (1200×630, fundo verde, nome da ONG em creme).
- Test: `web/src/lib/portal-datas.test.ts`

**Interfaces:**
- Consumes: funções de `servidor/portal.ts`, `sanitizarHtml` e tipos (Tarefa 6).
- Produces:
  ```ts
  // portal-datas.ts
  export function campanhaAtiva(c: { inicio: Date; fim: Date }, agora: Date): boolean;   // inclusivo por dia em America/Sao_Paulo
  export function eventoEhFuturo(e: { inicio: Date }, agora: Date): boolean;            // inicio > agora
  export function progressoCampanha(meta: { alvo: number; atual: number } | null): number | null; // null sem meta ou alvo ≤ 0; senão 0–100 (limitado)
  export function formatarDataHora(d: Date): string; // pt-BR, America/Sao_Paulo, "dd/mm/aaaa às HH:mm"
  ```
- `generateMetadata` em `[slug]`: `title`; `description` (o resumo); `openGraph.images` (capa ou o logo ou `/og-padrao.png`); `openGraph.type: 'article'`. Slug inexistente chama `notFound()`.
- **Compartilhar:** `https://wa.me/?text=<título> <url>` e "Copiar link" (`navigator.clipboard`). É Client Component.
- O menu e o botão "Doe agora" seguem a spec 5.2. No celular, o menu usa o `Sheet` já existente.

- [ ] **Step 1: Escrever os testes**
  - `campanhaAtiva({inicio: 2026-12-01T03:00Z, fim: 2026-12-24T03:00Z}, 2026-12-25T02:30Z)` (23h30 do dia 24 em São Paulo) → true (Review Focus 3).
  - O mesmo período em `2026-12-25T03:30Z` → false.
  - `eventoEhFuturo({inicio: 2026-12-20T02:00Z}, 2026-12-20T01:59Z)` → true.
  - `progressoCampanha(null)` → null; `({alvo:0,atual:5})` → null; `({alvo:500,atual:250})` → 50; `({alvo:500,atual:900})` → 100 (Review Focus 2).
  - `formatarDataHora(2026-12-20T22:30Z)` → `'20/12/2026 às 19:30'`.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Implementar as páginas. Na página inicial, seções vazias não renderizam (spec 5.1).
- [ ] **Step 4:** `npm test -w web && npm run lint -w web && npm run build -w web` → PASS
- [ ] **Step 5:** Commit: `feat(portal): layout natalino, início, publicações e 404`

### Task 8: Portal: como doar, voluntário, transparência e sobre

**Files:**
- Create:
  - `web/src/app/(portal)/como-doar/page.tsx`;
  - `web/src/components/portal/pix.tsx` (Client: QR com a lib `qrcode`, botões de copiar);
  - `web/src/app/(portal)/voluntario/page.tsx`;
  - `web/src/components/portal/formulario-voluntario.tsx`;
  - `web/src/app/(portal)/transparencia/page.tsx`;
  - `web/src/app/(portal)/sobre/page.tsx`;
  - `web/src/lib/agrupar-documentos.ts`.
- Test: `web/src/lib/agrupar-documentos.test.ts`, `web/src/components/portal/formulario-voluntario.test.tsx`

**Interfaces:**
- Consumes: `gerarPayloadPix`, `AJUDAS`, `DIAS`, `TURNOS`, `TEXTO_CONSENTIMENTO` (Tarefa 2); a callable `inscreverVoluntario` (Tarefa 4); `obterPix`, `obterConfigDoacoes`, `listarDocumentos`, `obterConfigPortal` (Tarefa 6).
- Produces:
  - `agruparDocumentos(docs: Documento[]): { categoria: Documento['categoria']; rotulo: string; anos: { ano: number; documentos: Documento[] }[] }[]`;
  - ordem das categorias: `prestacao_contas`, `relatorio_atividades`, `documentos_legais`, `outros`;
  - anos em ordem decrescente; categorias vazias são omitidas;
  - rótulos: "Prestação de contas", "Relatórios de atividades", "Estatuto e documentos legais", "Outros".
- **Formulário de voluntário:**
  - campos e regras da spec 6.2;
  - "Tem veículo?" aparece só com `entregas` marcado;
  - validação no cliente com as mesmas regras;
  - em erro de rede, mantém os dados e mostra o erro via `mensagemDeErro`;
  - em sucesso, mostra "Obrigado! Recebemos seu cadastro e nossa equipe vai entrar em contato pelo WhatsApp." e esconde o formulário.

- [ ] **Step 1: Escrever os testes**
  - `agruparDocumentos`: com documentos de 2025 e 2026 em `prestacao_contas` e um em `outros`, a saída tem 2 grupos, na ordem acima, e o grupo de prestação de contas tem os anos `[2026, 2025]`.
  - Formulário (Testing Library, com o `httpsCallable` mockado):
    - enviar vazio mostra os erros de nome, WhatsApp, cidade, ajudas, dias, turnos e consentimento, e não chama a função;
    - marcar "Entregas" mostra "Tem veículo?";
    - um envio válido chama a função com `whatsapp` como foi digitado (a normalização é do servidor) e mostra a mensagem de agradecimento;
    - uma rejeição mantém o campo nome preenchido.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w web && npm run lint -w web && npm run build -w web` → PASS
- [ ] **Step 5:** Commit: `feat(portal): como doar, voluntário, transparência e sobre`

### Task 9: Admin: Publicações

**Files:**
- Create:
  - `web/src/app/admin/(protegido)/publicacoes/page.tsx`;
  - `web/src/app/admin/(protegido)/publicacoes/[id]/page.tsx`;
  - `web/src/components/admin/publicacoes/{formulario-publicacao,editor-texto,campo-imagem,galeria}.tsx`;
  - `web/src/components/admin/publicacoes/salvar-publicacao.ts`.
- Modify: `web/src/components/admin/itens-menu.ts` (Publicações, Voluntários, Transparência e Portal, com as permissões), `web/src/components/admin/itens-menu.test.ts`
- Test: `web/src/components/admin/publicacoes/salvar-publicacao.test.ts`

**Interfaces:**
- Consumes: `gerarSlug`, `slugComSufixo` (Tarefa 2); `reduzirImagem`, `enviarArquivo` (Tarefa 6).
- Produces:
  - `escolherSlug(base: string, existe: (slug: string) => Promise<boolean>): Promise<string>`: testa `base`, depois `base-2`, `base-3`…, até 50 tentativas;
  - `dadosParaGravar(form: FormPublicacao, acao: 'rascunho'|'publicar'|'despublicar', atual: { publicadoEm: Date|null; slugFixado: boolean; slug: string }): Record<string, unknown>`:
    - `publicar` define `status:'publicada'`, `slugFixado:true` e `publicadoEm` (mantém o existente ou usa `serverTimestamp()`);
    - `despublicar` define `status:'rascunho'` e mantém slug e `publicadoEm`;
    - remove `evento` e `campanha` que não sejam da categoria escolhida.
- **Upload:**
  - caminho `publicacoes/{id}/{timestamp}.webp`;
  - imagem reduzida antes do envio;
  - o `id` vem de `doc(collection(db,'publicacoes')).id` gerado antes do primeiro upload.
- **Editor Tiptap:** `StarterKit` limitado a parágrafo, heading 2 e 3, negrito, itálico, listas e citação, mais `Link`. Grava `editor.getHTML()`.
- **Menu:** `itensVisiveis(['editor'])` passa a ser `['Painel','Publicações','Portal']`. "Portal" exige `doacoes:editar` **ou** `portal:configurar`. Para isso, `ItemMenu.permissao` passa a aceitar `Permissao | Permissao[]` (qualquer uma).

- [ ] **Step 1: Escrever os testes**
  - `escolherSlug('natal', s => Promise.resolve(['natal','natal-2'].includes(s)))` → `'natal-3'`.
  - `dadosParaGravar(..., 'publicar', {publicadoEm:null, slugFixado:false, slug:'x'})` tem `status:'publicada'` e `slugFixado:true`.
  - `despublicar` mantém o `slug`.
  - Uma categoria `noticia` com dados de evento no formulário gera `evento:null`.
  - `itens-menu.test.ts` atualizado:
    - `editor` → Painel, Publicações, Portal;
    - `coord_voluntarios` → Painel, Voluntários;
    - `tesouraria` → Painel, Transparência;
    - `diretoria` → Painel, Usuários, Auditoria, Voluntários, Transparência.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Implementar a lista, o editor e as ações (a exclusão só aparece para rascunho com `publicadoEm == null`).
- [ ] **Step 4:** `npm test -w web && npm run lint -w web && npm run build -w web` → PASS
- [ ] **Step 5:** Commit: `feat(admin): publicações`

### Task 10: Admin: Voluntários, Transparência e Portal

**Files:**
- Create:
  - `web/src/app/admin/(protegido)/voluntarios/page.tsx`;
  - `web/src/app/admin/(protegido)/voluntarios/[id]/page.tsx`;
  - `web/src/components/admin/voluntarios/filtrar-voluntarios.ts`;
  - `web/src/app/admin/(protegido)/transparencia/page.tsx`;
  - `web/src/app/admin/(protegido)/portal/page.tsx`;
  - `web/src/components/admin/portal/{aba-geral,aba-pix,aba-doacoes}.tsx`.
- Modify: `web/src/app/admin/(protegido)/auditoria/page.tsx` (ENTIDADES e ROTULO_ACAO: `voluntarios`, `config`; `voluntario.inscrever`, `voluntario.atualizar`, `pix.definir`)
- Test: `web/src/components/admin/voluntarios/filtrar-voluntarios.test.ts`

**Interfaces:**
- Consumes: as callables `atualizarVoluntario` e `definirPix` (Tarefa 5); `gerarPayloadPix` e `validarChavePix` (Tarefa 2), para a prévia e a validação no cliente; `enviarArquivo` (Tarefa 6).
- Produces: `filtrarVoluntarios(lista, f: { texto: string; status: 'todos'|'novo'|'ativo'|'inativo'; ajuda: string|'todas'; dia: string|'todos'; turno: string|'todos' })`. A busca no nome ignora acentos (reutilizar `normalizar` de `filtrar-usuarios.ts`).
- **Voluntários:**
  - a lista é ordenada por `criadoEm desc`;
  - na ficha, o botão "Abrir WhatsApp" aponta para `https://wa.me/55${whatsapp}`;
  - os campos editáveis (status e anotações) aparecem só com `voluntarios:gerenciar`.
- **Transparência:**
  - upload do PDF para `transparencia/{id}.pdf`;
  - grava o documento com `arquivado:false`;
  - as ações são Arquivar e Restaurar.
- **Portal:** cada aba aparece só com a permissão dela. A aba Geral faz o upload do logo em `portal/logo-{timestamp}.{ext}`.

- [ ] **Step 1: Escrever os testes** de `filtrarVoluntarios`:
  - o texto `'jose'` encontra "José";
  - `status:'novo'`;
  - `ajuda:'entregas'`;
  - `dia:'sab'` e `turno:'noite'` combinados.
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w web && npm run lint -w web && npm run build -w web` → PASS
- [ ] **Step 5:** Commit: `feat(admin): voluntários, transparência e configurações do portal`

### Task 11: Testes ponta a ponta do portal

**Files:**
- Modify: `web/e2e/semente.ts` (incluir `e2e-coord` com perfil `coord_voluntarios` e `e2e-tesouraria` com perfil `tesouraria`), `web/package.json` (`test:e2e` com `--only auth,firestore,functions,storage`)
- Create: `web/e2e/portal.spec.ts`, `web/e2e/arquivos/teste.pdf` (PDF mínimo válido) e `web/e2e/arquivos/foto.png` (200×200)

**Interfaces:**
- Consumes: tudo das Tarefas 1–10. Usa `PORTAL_SEM_CACHE=true` (Tarefa 1).

- [ ] **Step 1: Escrever `portal.spec.ts`**, com os cenários da spec 10 (E2E 1–5):
  1. O editor cria a campanha "Campanha Brinquedos 2026" com capa (`foto.png`) e meta 500/250 e publica. O visitante vê o título em `/` e a barra em 50% em `/publicacoes/campanha-brinquedos-2026`, e a página tem `<meta property="og:title" content="Campanha Brinquedos 2026">`. O editor despublica, e a página dá 404.
  2. O visitante preenche `/voluntario` e vê a mensagem de agradecimento. A coordenação vê o cadastro como "Novo" em `/admin/voluntarios`, muda para "Ativo" e a auditoria mostra `voluntario.atualizar`.
  3. A tesouraria envia `teste.pdf` ("Prestação de contas 2025", 2025). Ele aparece em `/transparencia`. Depois de arquivado, some.
  4. O admin define o Pix (aleatória `123e4567-e12b-12d1-a456-426655440000`, "Fulano de Tal", "BRASILIA"). `/como-doar` mostra a chave e um "copia e cola" que termina em `6304` + 4 caracteres hexadecimais.
  5. O editor abre `/admin/voluntarios` e vê "Você não tem permissão".
- [ ] **Step 2:** `npm run test:e2e -w web` → os novos falham ou passam conforme o estado. Corrigir até os 10 cenários (5 da Base + 5 novos) passarem.
- [ ] **Step 3:** `npm test` (raiz) → tudo PASS.
- [ ] **Step 4:** Commit: `test(e2e): portal, voluntários, transparência e Pix`

### Task 12: Publicação

**Files:**
- Modify: `README.md` (novas telas, Storage, ordem de deploy), `CLAUDE.md` (convenções do portal: `servidor/` só no servidor, `PORTAL_SEM_CACHE`)

- [ ] **Step 1:** Confirmar com o mantenedor que o Storage foi iniciado em `southamerica-east1` e pedir autorização para publicar.
- [ ] **Step 2:** Conferir se a conta de serviço do App Hosting tem `roles/datastore.user`:
  ```
  gcloud projects get-iam-policy grupo-natal-solidario --flatten=bindings --filter="bindings.members:firebase-app-hosting-compute"
  ```
  Se não tiver, concedê-lo, com autorização.
- [ ] **Step 3:** Publicar:
  ```
  firebase deploy --only firestore,storage,functions --project prod
  firebase deploy --only apphosting,hosting --project prod
  ```
- [ ] **Step 4:** Smoke test em https://gruponatalsolidario.web.app:
  - as páginas `/`, `/publicacoes`, `/como-doar`, `/voluntario`, `/transparencia` e `/sobre` respondem 200;
  - uma rota inexistente responde 404;
  - publicar um rascunho de teste, conferir que aparece em até 5 minutos, e despublicar.
- [ ] **Step 5:** Pedir ao mantenedor o teste manual do Pix num app de banco (critério 6 da spec).
- [ ] **Step 6:** Commit: `docs: portal publicado`
