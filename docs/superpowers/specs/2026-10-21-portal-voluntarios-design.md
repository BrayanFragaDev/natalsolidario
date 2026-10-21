# Natal Solidário — Subprojeto 2: Portal público + Voluntários (design)

- **Data:** 2026-10-21
- **Status:** aguardando revisão
- **Depende de:** subprojeto 1 (Base), `docs/superpowers/specs/2026-10-20-base-design.md`. As decisões transversais daquela spec (seção 3) continuam valendo.

## 1. Objetivo

Dar à ONG um site público próprio em **https://gruponatalsolidario.web.app**. O site precisa:
- transmitir credibilidade e transparência;
- levar o visitante a **doar** (Pix ou itens físicos) e a **se inscrever como voluntário**;
- divulgar campanhas, eventos e notícias;
- manter um arquivo próprio do conteúdo, fora do Instagram.

No admin, a equipe publica conteúdo, gere voluntários, publica documentos de transparência e configura o portal, sem precisar de alguém técnico.

## 2. Escopo

**Dentro:**
- páginas públicas: início, publicações, como doar, voluntário, transparência, sobre;
- módulos do admin: Publicações, Voluntários, Transparência, Portal (Geral, Pix e Doações);
- novas permissões, regras, Functions, Storage e testes.

**Fora**, para subprojetos futuros:
- "Adote uma cartinha";
- participação de voluntários em eventos (subprojeto 3);
- e-mail automático para o voluntário;
- números automáticos do financeiro na transparência (subprojeto 4);
- doação online com confirmação de pagamento.

## 3. Decisões principais

| Tema | Decisão |
|---|---|
| Renderização do portal | Server Components do Next.js lendo o Firestore com `firebase-admin` no servidor. Cache com `use cache` + `cacheLife` de **5 minutos**. Sem revalidação sob demanda nesta fase |
| Tipos de conteúdo | Um tipo **Publicação**, com categoria `noticia`, `campanha` ou `evento` |
| Doações | **Pix** (chave + QR Code + "copia e cola" estáticos, padrão BR Code do Banco Central) e **itens físicos** (lista do que está faltando + pontos de coleta) |
| Voluntário | Formulário público enviado por Cloud Function. A coordenação contata pelo WhatsApp |
| Transparência | PDFs enviados pelo admin, agrupados por categoria e ano |
| Identidade visual | Cores natalinas (seção 5.3). Logo enviado pelo admin, sem logo fixo no código |
| Texto rico | Editor visual (Tiptap). O HTML é gravado e **sanitizado no servidor** a cada renderização, com uma lista fixa de elementos permitidos |
| Imagens | Reduzidas no navegador antes do upload: lado maior com no máximo 1600 px, WebP com qualidade 0,82 e fallback para JPEG |

## 4. Permissões

Acrescentar a `shared/src/permissoes.ts`, espelhar em `firebase/firestore.rules` e em `firebase/storage.rules`, e testar:

| Permissão | admin | diretoria | tesouraria | editor | coord_voluntarios |
|---|---|---|---|---|---|
| `publicacoes:editar` | ✔ | | | ✔ | |
| `doacoes:editar` | ✔ | | | ✔ | |
| `voluntarios:ver` | ✔ | ✔ | | | ✔ |
| `voluntarios:gerenciar` | ✔ | | | | ✔ |
| `transparencia:editar` | ✔ | ✔ | ✔ | | |
| `portal:configurar` | ✔ | | | | |

`almoxarifado` e `membro` não ganham nenhuma permissão nova.

## 5. Portal público

### 5.1 Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Hero com logo, frase de chamada e botões "Quero doar" (`/como-doar`) e "Quero ser voluntário" (`/voluntario`) · campanhas ativas (período inclui hoje) em destaque, com barra de progresso quando há meta · próximos eventos (início ≥ agora, até 3) · últimas notícias (até 6) · faixa de números da ONG |
| `/publicacoes` | Lista paginada (12 por página, `?pagina=`), filtro `?categoria=noticia\|campanha\|evento` |
| `/publicacoes/[slug]` | Capa, título, data, texto, galeria. Evento: data, horário e local (com link para o Maps). Campanha: período e progresso. Botões "Compartilhar no WhatsApp" e "Copiar link". Metadados Open Graph e Twitter (título, resumo, capa) |
| `/como-doar` | Pix: nome do recebedor, chave com "copiar", QR Code e "Pix copia e cola" com "copiar" · itens que estão faltando · pontos de coleta (nome, endereço, horário, link "Como chegar") |
| `/voluntario` | Formulário (seção 6.2) e mensagem de agradecimento |
| `/transparencia` | Documentos não arquivados, agrupados por categoria e, dentro dela, por ano (decrescente), com link de download |
| `/sobre` | Texto "Quem somos" (HTML sanitizado) e contatos |
| `not-found` | 404 com o visual do portal |

- Seções sem dados (por exemplo, Pix não configurado ou nenhum evento futuro) **não aparecem**.
- `metadata` padrão: título "Grupo Natal Solidário" e a imagem Open Graph padrão (o logo, ou `public/og-padrao.png` se não houver logo).

### 5.2 Layout

- **Cabeçalho:** logo e menu (Início, Publicações, Como doar, Seja voluntário, Transparência, Sobre), com botão fixo **"Doe agora"**. No celular o menu vira gaveta.
- **Rodapé:** Instagram, WhatsApp, e-mail, CNPJ e o link discreto "Área restrita" (`/admin/login`).
- Mobile first. Imagens com `next/image`, com `width`, `height` e `alt`.

### 5.3 Identidade visual

| Token | Cor | Uso |
|---|---|---|
| `--natal-vermelho` | `#B3202A` | botões primários, destaques |
| `--natal-verde` | `#1F5135` | títulos, links, rodapé |
| `--natal-dourado` | `#D4A24C` | ícones, detalhes, barra de progresso |
| `--natal-creme` | `#FBF7F0` | fundo do portal |
| texto | `#22201C` | corpo |

- Títulos em fonte serifada (Fraunces) e corpo em sem serifa (Geist), ambas via `next/font`.
- Todos os pares texto/fundo atendem WCAG AA (contraste ≥ 4,5:1 para texto normal).
- O admin mantém o tema neutro atual.

### 5.4 Leitura de dados e cache

- O módulo `web/src/lib/servidor/` (importado só por Server Components, com `import 'server-only'`) inicializa o `firebase-admin` com o banco de `NEXT_PUBLIC_FIRESTORE_DATABASE`.
- Funções de leitura:
  - `listarPublicacoes`, `obterPublicacaoPorSlug`, `listarCampanhasAtivas`, `listarProximosEventos`, `listarDocumentos`, `obterConfigPortal`, `obterConfigDoacoes`, `obterPix`.
- Toda consulta filtra `status == 'publicada'` (publicações) ou `arquivado == false` (documentos).
- Cada função usa `'use cache'` + `cacheLife` com `revalidate: 300`.
- O Firebase Hosting na frente respeita o `Cache-Control` gerado. Critério: uma publicação nova aparece em até 5 minutos.
- No App Hosting, as credenciais do `firebase-admin` vêm da conta de serviço do backend. Ela precisa do papel `roles/datastore.user` no projeto, o que deve ser conferido no deploy.

## 6. Módulos do admin

Novos itens em `web/src/components/admin/itens-menu.ts`: Publicações, Voluntários, Transparência e Portal, cada um exigindo a permissão correspondente.

### 6.1 Publicações (`/admin/publicacoes`)

- **Lista:** título, categoria, situação e data. Filtros por categoria e situação. Botão "Nova publicação".
- **Editor** (`/admin/publicacoes/[id]`, `novo` para criar):

| Campo | Regra |
|---|---|
| Título | obrigatório, 3–140 caracteres |
| Categoria | obrigatória |
| Resumo | obrigatório, até 280 caracteres (vai para a prévia de link) |
| Capa | imagem opcional, com texto alternativo obrigatório se houver |
| Texto | editor Tiptap: parágrafo, H2, H3, negrito, itálico, listas, link, citação |
| Galeria | até 20 imagens, cada uma com texto alternativo |
| Evento | início (data e hora, obrigatório), fim (opcional), local (texto), endereço para o Maps (opcional) |
| Campanha | início e fim (datas, obrigatórios). Meta opcional: descrição ("brinquedos"), alvo (inteiro > 0) e atual (inteiro ≥ 0, editado à mão) |

- **Ações:** "Salvar rascunho", "Publicar" (grava `publicadoEm` na primeira vez), "Despublicar" (volta a rascunho) e "Ver no site".
- **Slug:** gerado do título (minúsculas, sem acentos, hífens, até 80 caracteres). Se já existir, recebe o sufixo `-2`, `-3` e assim por diante. **O slug é fixado na primeira publicação** e não muda depois.
- **Exclusão:** só de rascunhos que nunca foram publicados. Uma publicação já publicada pode apenas ser despublicada.

### 6.2 Voluntários

**Formulário público** (`/voluntario`):

| Campo | Regra |
|---|---|
| Nome | obrigatório, 2–100 |
| WhatsApp | obrigatório, 10–11 dígitos (aceita máscara, que é removida antes de salvar) |
| E-mail | opcional, válido |
| Cidade / bairro | obrigatório, 2–100 |
| Como pode ajudar | ao menos um de: `arrecadacao`, `triagem` (triagem e embalagem), `entregas`, `eventos`, `divulgacao` (divulgação e redes sociais), `outro` |
| Tem veículo? | sim ou não. A pergunta aparece só quando "entregas" está marcado |
| Dias | ao menos um de `seg`…`dom` |
| Turnos | ao menos um de `manha`, `tarde`, `noite` |
| Observações | opcional, até 500 |
| Consentimento | obrigatório. Texto exato: "Autorizo o Grupo Natal Solidário a usar estes dados para entrar em contato sobre ações voluntárias, conforme a LGPD." |

**Admin:**
- **Lista** (`/admin/voluntarios`):
  - colunas: nome, cidade/bairro, ajudas, status e data;
  - filtros por status, ajuda, dia e turno;
  - busca por nome;
  - novos cadastros primeiro.
- **Ficha:** todos os dados, o botão **"Abrir WhatsApp"** (`https://wa.me/55<número>`), a troca de status (`novo`, `ativo`, `inativo`) e anotações internas (até 2000 caracteres).

### 6.3 Transparência (`/admin/transparencia`)

- Upload de PDF (até 20 MB) com título (3–140), ano (2000 até o ano atual + 1) e categoria: `prestacao_contas`, `relatorio_atividades`, `documentos_legais` ou `outros`.
- Lista com as ações "Arquivar" e "Restaurar". Não há exclusão.

### 6.4 Portal (`/admin/portal`)

- **Aba Geral** (`portal:configurar`):
  - logo (PNG, SVG ou WebP, até 1 MB);
  - frase de chamada (até 160);
  - números da ONG: até 4 itens, cada um com rótulo e valor em texto livre;
  - WhatsApp, e-mail, Instagram e CNPJ;
  - texto "Sobre", no mesmo editor das publicações.
- **Aba Pix** (`portal:configurar`): tipo da chave, chave, nome do recebedor (até 25 caracteres, sem acentos no payload) e cidade (até 15). Mostra a prévia do QR Code. Salvar chama a Function `definirPix`.
- **Aba Doações** (`doacoes:editar`):
  - itens que estão faltando: lista de textos curtos, até 30;
  - pontos de coleta: nome, endereço, horário e link do Maps opcional, até 20.

## 7. Dados

### 7.1 Firestore

**`publicacoes/{id}`**
```
titulo, slug, categoria, resumo, conteudoHtml,
capa: { url, caminho, alt } | null,
galeria: [{ url, caminho, alt }],
status: 'rascunho' | 'publicada',
publicadoEm: Timestamp | null, slugFixado: boolean,
evento: { inicio: Timestamp, fim: Timestamp | null, local, enderecoMaps | null } | null,
campanha: { inicio: Timestamp, fim: Timestamp, meta: { descricao, alvo, atual } | null } | null,
criadoPor, criadoEm, atualizadoPor, atualizadoEm
```

**`voluntarios/{id}`**
```
nome, whatsapp, email | null, cidadeBairro, ajudas: string[], veiculo: boolean | null,
dias: string[], turnos: string[], observacoes | null,
consentimento: { em: Timestamp, texto },
status: 'novo' | 'ativo' | 'inativo', anotacoes | null,
criadoEm, atualizadoEm
```

**`inscricoesRecentes/{whatsapp}`**: `{ em: Timestamp }`. Controle interno contra envios repetidos. Nenhum cliente acessa.

**`documentos/{id}`**
```
titulo, ano, categoria, arquivo: { url, caminho, tamanho }, arquivado: boolean,
criadoPor, criadoEm, atualizadoEm
```

**`config/portal`**: `logo: { url, caminho } | null, frase, numeros: [{ rotulo, valor }], whatsapp, email, instagram, cnpj, sobreHtml`

**`config/doacoes`**: `necessidades: string[], pontosColeta: [{ nome, endereco, horario, linkMaps | null }]`

**`config/pix`**: `tipo: 'cpf'|'cnpj'|'email'|'telefone'|'aleatoria', chave, nomeRecebedor, cidade, atualizadoEm`

### 7.2 Regras do Firestore (resumo)

| Coleção | Leitura | Escrita |
|---|---|---|
| `publicacoes` | pública se `status == 'publicada'`; todas com `publicacoes:editar` | `publicacoes:editar`, com validação de campos. `delete` só se `publicadoEm == null`. `slug` imutável quando `slugFixado == true` |
| `voluntarios` | `voluntarios:ver` | nenhuma de cliente (só Functions) |
| `inscricoesRecentes` | nenhuma | nenhuma |
| `documentos` | pública se `arquivado == false`; todas com `transparencia:editar` | `transparencia:editar`, sem `delete` |
| `config/portal` | pública | `portal:configurar` |
| `config/doacoes` | pública | `doacoes:editar` |
| `config/pix` | pública | nenhuma de cliente (só `definirPix`) |

### 7.3 Storage

Ativado pelo mantenedor em `southamerica-east1`.

| Caminho | Leitura | Escrita |
|---|---|---|
| `publicacoes/{id}/{arquivo}` | pública | `publicacoes:editar`; `image/*`; ≤ 5 MB |
| `transparencia/{id}.pdf` | pública | `transparencia:editar`; `application/pdf`; ≤ 20 MB |
| `portal/{arquivo}` | pública | `portal:configurar`; `image/*`; ≤ 1 MB |

A permissão é verificada com `firestore.get()` no banco `natalsolidario`, lendo `usuarios/{uid}`, como nas regras do Firestore.

### 7.4 Cloud Functions (callable, `southamerica-east1`)

| Função | Quem | Comportamento |
|---|---|---|
| `inscreverVoluntario` | público (sem login), App Check obrigatório | Valida com Zod (seção 6.2) e normaliza o WhatsApp. Em uma transação: se `inscricoesRecentes/{whatsapp}` existe com `em` há menos de 24 h, não grava nada e devolve sucesso (a resposta é igual nos dois casos); senão, cria o `voluntarios`, grava `inscricoesRecentes` e registra a auditoria `voluntario.inscrever` (ator `{uid: 'publico', nome: 'Formulário público'}`) |
| `atualizarVoluntario` | `voluntarios:gerenciar` | `{ id, status?, anotacoes? }`. Transação com `reconfirmarPermissao` e auditoria `voluntario.atualizar` (antes e depois) |
| `definirPix` | `portal:configurar` | Valida a chave pelo tipo (CPF e CNPJ com dígito verificador, e-mail, telefone `+55` + DDD + número, aleatória como UUID) e grava `config/pix` com auditoria `pix.definir` |

## 8. Módulos compartilhados

| Módulo | Responsabilidade |
|---|---|
| `shared/src/pix.ts` | `gerarPayloadPix({ chave, nomeRecebedor, cidade, txid? }): string` (BR Code EMV, CRC16-CCITT) e `validarChavePix(tipo, chave): boolean` |
| `shared/src/slug.ts` | `gerarSlug(titulo): string` |
| `shared/src/voluntario.ts` | constantes de ajudas, dias e turnos com rótulos, e o texto de consentimento |
| `web/src/lib/sanitizar.ts` | `sanitizarHtml(html): string` com lista fixa: `p, h2, h3, strong, em, ul, ol, li, a[href,target,rel], blockquote, br`. Links só `http`, `https` e `mailto`. Acrescenta `rel="noopener noreferrer"` |
| `web/src/lib/imagem.ts` | `reduzirImagem(arquivo, ladoMaximo = 1600): Promise<Blob>` |

## 9. Erros e casos de borda

- **Formulário de voluntário:**
  - os erros aparecem por campo, em pt-BR;
  - em falha de rede, os dados preenchidos ficam na tela;
  - um envio repetido em 24 h mostra a mesma mensagem de sucesso.
- **Publicação sem capa:** a prévia usa a imagem Open Graph padrão.
- **Slug, publicação despublicada ou inexistente:** 404.
- **Configurações ausentes:** a seção correspondente some.
- **Upload acima do limite ou de tipo errado:** a mensagem é clara na interface, e as regras do Storage recusam do mesmo jeito.
- **Pix inválido:** `invalid-argument` com a mensagem do tipo ("CPF inválido.").

## 10. Testes

- **Unitários (Vitest):**
  - `gerarPayloadPix`, conferido contra um payload de referência publicado pelo Banco Central;
  - `validarChavePix`;
  - `gerarSlug`;
  - `sanitizarHtml` (remove `<script>`, `on*`, `javascript:`);
  - filtros e listas do admin;
  - `reduzirImagem` (dimensões).
- **Regras (emulador):** a matriz da seção 4 aplicada a cada coleção e caminho do Storage, a leitura pública restrita a publicadas e não arquivadas, `voluntarios` nunca público e a imutabilidade do slug.
- **Functions (emulador):**
  - `inscreverVoluntario`: válido; inválido; sem consentimento; repetido em menos de 24 h, sem segundo registro e com a mesma resposta;
  - `atualizarVoluntario`: com e sem permissão;
  - `definirPix`: CPF, CNPJ, e-mail, telefone e aleatória, válidos e inválidos.
- **E2E (Playwright):**
  1. O editor cria e publica uma campanha com meta; ela aparece no início e em `/publicacoes/[slug]`. Despublicar a tira do site (nos testes, o cache fica desligado com uma variável de ambiente).
  2. Um visitante se inscreve em `/voluntario`; a coordenação vê o cadastro como "Novo" e muda para "Ativo".
  3. A tesouraria envia um PDF; ele aparece em `/transparencia`; ao arquivar, ele some.
  4. O admin define o Pix; `/como-doar` mostra a chave e o "copia e cola".
  5. Um editor não acessa `/admin/voluntarios`.

## 11. Critérios de aceitação

1. Todas as páginas da seção 5.1 funcionam no celular e no computador, com as cores da seção 5.3 e o logo enviado pelo admin.
2. Compartilhar `/publicacoes/[slug]` no WhatsApp mostra título, resumo e capa.
3. Uma publicação nova aparece no site em até 5 minutos.
4. A inscrição de voluntário funciona sem login e chega ao admin como "Novo". Repetir o envio em menos de 24 h não duplica o cadastro.
5. Cada perfil só acessa o que a seção 4 permite, e os testes de regras provam isso.
6. O QR Code e o "copia e cola" são aceitos por um app de banco real (teste manual do mantenedor).
7. Lint, testes unitários, de regras, de Functions e E2E passam. O site está publicado em gruponatalsolidario.web.app.

## 12. Pré-requisitos e riscos

- **Mantenedor:** iniciar o Storage no console em `southamerica-east1` antes do deploy.
- **Conta de serviço do App Hosting:** precisa ler o Firestore (`roles/datastore.user`). Conferir no deploy.
- **Regras do Storage lendo um banco Firestore com nome:** confirmar no emulador e em produção que `firestore.get()` aceita o caminho `/databases/natalsolidario/...`. Se não aceitar, a alternativa é fazer o upload por URL assinada gerada por uma Function.
- **Spam no formulário:** mitigado pelo App Check, pelo bloqueio de 24 h por WhatsApp e pela validação. Se não bastar, acrescentar limite por IP na Function.
