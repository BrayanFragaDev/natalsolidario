import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const chamar = vi.hoisted(() => vi.fn());

vi.mock('@/lib/firebase', () => ({ functions: {} }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => chamar }));

import { FormularioVoluntario } from './formulario-voluntario';

function preencherValido() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } });
  fireEvent.change(screen.getByLabelText('WhatsApp'), { target: { value: '(11) 98765-4321' } });
  fireEvent.change(screen.getByLabelText('Cidade / bairro'), { target: { value: 'Mooca' } });
  fireEvent.click(screen.getByLabelText('Arrecadação'));
  fireEvent.click(screen.getByLabelText('Sábado'));
  fireEvent.click(screen.getByLabelText('Manhã'));
  fireEvent.click(screen.getByLabelText(/Autorizo o Grupo Natal Solidário/));
}

beforeEach(() => {
  chamar.mockReset();
  render(<FormularioVoluntario />);
});

describe('FormularioVoluntario', () => {
  it('envio vazio mostra os erros e não chama a função', async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Enviar cadastro' }));
    for (const mensagem of [
      'Informe o nome.',
      'Informe o WhatsApp com DDD.',
      'Informe a cidade ou o bairro.',
      'Escolha como pode ajudar.',
      'Escolha ao menos um dia.',
      'Escolha ao menos um turno.',
      'É preciso autorizar o contato para enviar o cadastro.',
    ]) {
      expect(await screen.findByText(mensagem)).toBeInTheDocument();
    }
    expect(chamar).not.toHaveBeenCalled();
  });

  it('"Tem veículo?" aparece só com Entregas marcado', () => {
    expect(screen.queryByText('Tem veículo para as entregas?')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Entregas'));
    expect(screen.getByText('Tem veículo para as entregas?')).toBeInTheDocument();
  });

  it('envio válido chama a função e agradece', async () => {
    chamar.mockResolvedValue({ data: { ok: true } });
    preencherValido();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar cadastro' }));
    expect(
      await screen.findByText('Obrigado! Recebemos seu cadastro e nossa equipe vai entrar em contato pelo WhatsApp.'),
    ).toBeInTheDocument();
    expect(chamar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Maria Souza',
        whatsapp: '(11) 98765-4321',
        ajudas: ['arrecadacao'],
        dias: ['sab'],
        turnos: ['manha'],
        consentimento: true,
      }),
    );
  });

  it('erro no envio mantém os dados preenchidos', async () => {
    chamar.mockRejectedValue(Object.assign(new Error('x'), { code: 'functions/unavailable' }));
    preencherValido();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar cadastro' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado. Tente novamente.'));
    expect(screen.getByLabelText('Nome')).toHaveValue('Maria Souza');
  });
});
