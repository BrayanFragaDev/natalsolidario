import { onCall } from 'firebase-functions/v2/https';
import { opcoesCallable } from './lib/requisicao';
import { convidar } from './usuarios/convidar';
import { definirPerfis as definirPerfisHandler } from './usuarios/definirPerfis';
import { desativar, reativar } from './usuarios/situacao';
import { definirPixHandler } from './portal/definirPix';
import { atualizar } from './voluntarios/atualizar';
import { inscrever } from './voluntarios/inscrever';

export const convidarUsuario = onCall(opcoesCallable, (req) => convidar(req));
export const definirPerfis = onCall(opcoesCallable, (req) => definirPerfisHandler(req));
export const desativarUsuario = onCall(opcoesCallable, (req) => desativar(req));
export const reativarUsuario = onCall(opcoesCallable, (req) => reativar(req));
export const inscreverVoluntario = onCall(opcoesCallable, (req) => inscrever(req));
export const atualizarVoluntario = onCall(opcoesCallable, (req) => atualizar(req));
export const definirPix = onCall(opcoesCallable, (req) => definirPixHandler(req));
