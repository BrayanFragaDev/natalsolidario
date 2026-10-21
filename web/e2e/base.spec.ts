import { expect, test, type Page } from '@playwright/test';
import { SENHA } from './semente';

async function entrar(page: Page, email: string, senha = SENHA) {
  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('admin convida um editor e a ação aparece na auditoria', async ({ page }) => {
  await entrar(page, 'admin@teste.local');
  await expect(page.getByRole('heading', { name: 'Olá, Admin' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Usuários' }).first().click();
  await page.getByRole('button', { name: 'Convidar' }).click();
  const dialogo = page.getByRole('dialog');
  await dialogo.getByLabel('Nome').fill('Ana Souza');
  await dialogo.getByLabel('E-mail').fill(' Ana@Exemplo.com ');
  await dialogo.getByRole('checkbox', { name: 'Editor' }).click();
  await dialogo.getByRole('button', { name: 'Enviar convite' }).click();

  await expect(dialogo.getByRole('heading', { name: 'Convite criado' })).toBeVisible();
  await expect(dialogo.getByLabel('Link do convite')).toHaveValue(/^http/);
  await page.keyboard.press('Escape');

  await expect(page.getByRole('cell', { name: 'ana@exemplo.com' })).toBeVisible();

  await page.goto('/admin/auditoria');
  await expect(page.getByRole('cell', { name: 'Convidou usuário' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
  await expect(page.getByText('ana@exemplo.com')).toBeVisible();
});

test('editor vê só os módulos dele e não acessa usuários', async ({ page }) => {
  await entrar(page, 'editor@teste.local');
  await expect(page.getByRole('heading', { name: 'Olá, Editor' })).toBeVisible();

  const menu = page.getByRole('navigation', { name: 'Menu principal' }).first();
  await expect(menu.getByRole('link')).toHaveText(['Painel', 'Publicações', 'Portal']);

  await page.goto('/admin/usuarios');
  await expect(page.getByText('Você não tem permissão para ver os usuários.')).toBeVisible();
});

test('usuário desativado perde a sessão na hora', async ({ browser }) => {
  const contextoEditor = await browser.newContext();
  const editor = await contextoEditor.newPage();
  await entrar(editor, 'editor2@teste.local');
  await expect(editor.getByRole('heading', { name: 'Olá, Editora' })).toBeVisible();

  const contextoAdmin = await browser.newContext();
  const admin = await contextoAdmin.newPage();
  await entrar(admin, 'admin@teste.local');
  await expect(admin.getByRole('heading', { name: 'Olá, Admin' })).toBeVisible();
  await admin.goto('/admin/usuarios');
  await admin.getByRole('row', { name: /Editora Dois/ }).getByRole('button', { name: 'Desativar' }).click();
  await admin.getByRole('alertdialog').getByRole('button', { name: 'Desativar' }).click();
  await expect(admin.getByText('Editora Dois foi desativado(a).')).toBeVisible();

  await expect(editor).toHaveURL(/\/admin\/login/);

  await contextoEditor.close();
  await contextoAdmin.close();
});

test('senha errada mostra mensagem clara', async ({ page }) => {
  await entrar(page, 'admin@teste.local', 'senha-errada');
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('diretoria vê usuários sem botões de gestão', async ({ page }) => {
  await entrar(page, 'diretoria@teste.local');
  await expect(page.getByRole('heading', { name: 'Olá, Diretoria' })).toBeVisible();
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('cell', { name: 'admin@teste.local' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Convidar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Desativar' })).toHaveCount(0);
});
