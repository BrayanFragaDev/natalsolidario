import type { StatusVoluntario } from '@natal/shared';
import { normalizar } from '@/components/admin/usuarios/filtrar-usuarios';

export interface VoluntarioLista {
  id: string;
  nome: string;
  whatsapp: string;
  cidadeBairro: string;
  ajudas: string[];
  dias: string[];
  turnos: string[];
  status: StatusVoluntario;
  criadoEm: Date | null;
}

export interface FiltroVoluntarios {
  texto: string;
  status: 'todos' | StatusVoluntario;
  ajuda: string;
  dia: string;
  turno: string;
}

export function filtrarVoluntarios(lista: VoluntarioLista[], f: FiltroVoluntarios): VoluntarioLista[] {
  const busca = normalizar(f.texto);
  return lista.filter(
    (v) =>
      (!busca || normalizar(v.nome).includes(busca)) &&
      (f.status === 'todos' || v.status === f.status) &&
      (f.ajuda === 'todas' || v.ajudas.includes(f.ajuda)) &&
      (f.dia === 'todos' || v.dias.includes(f.dia)) &&
      (f.turno === 'todos' || v.turnos.includes(f.turno)),
  );
}
