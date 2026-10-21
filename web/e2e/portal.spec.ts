import { resolve } from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { SENHA } from './semente';

const ARQUIVOS = resolve(__dirname, 'arquivos');

async function entrar(page: Page, email: string) {
  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Olá/ })).toBeVisible();
}

async function comoPessoa(browser: Browser, email: string) {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await entrar(page, email);
  return { page, fechar: () => contexto.close() };
}

// Dia em São Paulo, no formato do <input type="date">.
function diaSP(deslocamentoDias = 0) {
  const d = new Date(Date.now() + deslocamentoDias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

test('editor publica campanha com meta; despublicar tira do ar', async ({ browser, page: visitante }) => {
  const editor = await comoPessoa(browser, 'editor@teste.local');
  const p = editor.page;

  await p.goto('/admin/publicacoes/novo');
  await p.getByRole('textbox', { name: 'Título' }).fill('Campanha Brinquedos 2026');
  await p.getByLabel('Categoria').selectOption('campanha');
  await p.getByLabel('Resumo').fill('Ajude a levar brinquedos a 500 crianças neste Natal.');
  await p.getByLabel('Início', { exact: true }).fill(diaSP(-1));
  await p.getByLabel('Fim', { exact: true }).fill(diaSP(10));
  await p.getByLabel('Mostrar meta com barra de progresso').check();
  await p.getByLabel('O que está sendo arrecadado').fill('brinquedos');
  await p.getByLabel('Meta', { exact: true }).fill('500');
  await p.getByLabel('Arrecadado', { exact: true }).fill('250');
  await p.getByLabel('Capa', { exact: true }).setInputFiles(resolve(ARQUIVOS, 'foto.png'));
  await p.getByLabel('Capa: texto alternativo').fill('Caixas de brinquedos doados');
  await p.getByRole('button', { name: 'Publicar' }).click();
  await expect(p.getByText(/Publicação no ar!/)).toBeVisible();

  await visitante.goto('/');
  await expect(visitante.getByRole('heading', { name: 'Campanha Brinquedos 2026' })).toBeVisible();

  await visitante.goto('/publicacoes/campanha-brinquedos-2026');
  await expect(visitante.getByRole('heading', { level: 1, name: 'Campanha Brinquedos 2026' })).toBeVisible();
  await expect(visitante.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  await expect(visitante.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Campanha Brinquedos 2026');

  await p.getByRole('button', { name: 'Despublicar' }).click();
  await expect(p.getByText('Publicação retirada do site.')).toBeVisible();

  await visitante.goto('/publicacoes/campanha-brinquedos-2026');
  await expect(visitante.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await editor.fechar();
});

test('visitante se inscreve; coordenação ativa o voluntário; admin vê na auditoria', async ({ browser, page: visitante }) => {
  await visitante.goto('/voluntario');
  await visitante.getByLabel('Nome').fill('Voluntária Teste E2E');
  await visitante.getByLabel('WhatsApp').fill('(11) 91234-5678');
  await visitante.getByLabel('Cidade / bairro').fill('São Paulo / Mooca');
  await visitante.getByText('Triagem e embalagem').click();
  await visitante.getByText('Sábado').click();
  await visitante.getByText('Tarde').click();
  await visitante.getByLabel(/Autorizo o Grupo Natal Solidário/).check();
  await visitante.getByRole('button', { name: 'Enviar cadastro' }).click();
  // A primeira chamada a uma Function no emulador inicializa o processo (alguns segundos).
  await expect(visitante.getByText(/Obrigado! Recebemos seu cadastro/)).toBeVisible({ timeout: 60_000 });

  const coord = await comoPessoa(browser, 'coord@teste.local');
  await coord.page.goto('/admin/voluntarios');
  const linha = coord.page.getByRole('row', { name: /Voluntária Teste E2E/ });
  await expect(linha.getByText('Novo')).toBeVisible();
  await linha.getByRole('link', { name: 'Voluntária Teste E2E' }).click();
  await expect(coord.page.getByRole('heading', { level: 1, name: 'Voluntária Teste E2E' })).toBeVisible();
  await expect(coord.page.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511912345678');
  await coord.page.getByLabel('Situação', { exact: true }).selectOption('ativo');
  await expect(coord.page.getByText('Voluntário atualizado.')).toBeVisible();
  await coord.fechar();

  const admin = await comoPessoa(browser, 'admin@teste.local');
  await admin.page.goto('/admin/auditoria');
  await expect(admin.page.getByRole('cell', { name: 'Atualizou voluntário' })).toBeVisible();
  await expect(admin.page.getByRole('cell', { name: 'Voluntário se inscreveu' })).toBeVisible();
  await admin.fechar();
});

test('tesouraria publica e arquiva um PDF de transparência', async ({ browser, page: visitante }) => {
  const tes = await comoPessoa(browser, 'tesouraria@teste.local');
  await tes.page.goto('/admin/transparencia');
  await tes.page.getByLabel('Título').fill('Prestação de contas 2025');
  await tes.page.getByLabel('Ano').fill('2025');
  await tes.page.getByLabel(/Arquivo PDF/).setInputFiles(resolve(ARQUIVOS, 'teste.pdf'));
  await tes.page.getByRole('button', { name: 'Publicar documento' }).click();
  await expect(tes.page.getByText(/Documento publicado/)).toBeVisible();

  await visitante.goto('/transparencia');
  await expect(visitante.getByRole('link', { name: /Prestação de contas 2025/ })).toBeVisible();

  await tes.page.getByRole('row', { name: /Prestação de contas 2025/ }).getByRole('button', { name: 'Arquivar' }).click();
  await expect(tes.page.getByText(/Documento arquivado/)).toBeVisible();

  await visitante.reload();
  await expect(visitante.getByRole('link', { name: /Prestação de contas 2025/ })).toHaveCount(0);
  await tes.fechar();
});

test('admin define o Pix e o portal mostra a chave e o copia e cola', async ({ browser, page: visitante }) => {
  const admin = await comoPessoa(browser, 'admin@teste.local');
  await admin.page.goto('/admin/portal');
  await admin.page.getByRole('tab', { name: 'Pix' }).click();
  await admin.page.getByLabel('Tipo da chave').selectOption('aleatoria');
  await admin.page.getByLabel('Chave', { exact: true }).fill('123e4567-e12b-12d1-a456-426655440000');
  await admin.page.getByLabel(/Nome do recebedor/).fill('Fulano de Tal');
  await admin.page.getByLabel(/Cidade/).fill('BRASILIA');
  await admin.page.getByRole('button', { name: 'Salvar Pix' }).click();
  await expect(admin.page.getByText(/Pix atualizado/)).toBeVisible();
  await admin.fechar();

  await visitante.goto('/como-doar');
  await expect(visitante.getByTestId('chave-pix')).toHaveText('123e4567-e12b-12d1-a456-426655440000');
  await expect(visitante.getByTestId('pix-copia-e-cola')).toHaveText(
    '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
  );
});

test('editor não acessa voluntários', async ({ page }) => {
  await entrar(page, 'editor@teste.local');
  await page.goto('/admin/voluntarios');
  await expect(page.getByText('Você não tem permissão para ver os voluntários.')).toBeVisible();
});
