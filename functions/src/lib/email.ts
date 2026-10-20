import { db } from './admin';

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Enfileira o e-mail na coleção lida pela extensão "Trigger Email".
// Sem CONVITE_POR_EMAIL=true (ex.: ambiente local), não envia e devolve false,
// e quem chamou entrega o link manualmente.
export async function enviarConvite(email: string, nome: string, link: string): Promise<boolean> {
  if (process.env.CONVITE_POR_EMAIL !== 'true') return false;

  await db.collection('mail').add({
    to: email,
    message: {
      subject: 'Convite para o Natal Solidário',
      html: `
        <p>Olá, ${escaparHtml(nome)}!</p>
        <p>Você foi convidado(a) para acessar a área administrativa do Natal Solidário.</p>
        <p><a href="${escaparHtml(link)}" style="display:inline-block;padding:10px 16px;background:#b91c1c;color:#fff;border-radius:6px;text-decoration:none">Definir minha senha</a></p>
        <p>Se você não esperava este convite, ignore esta mensagem.</p>
      `,
    },
  });
  return true;
}
