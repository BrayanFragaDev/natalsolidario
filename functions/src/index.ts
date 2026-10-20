import { onCall } from 'firebase-functions/v2/https';
import { opcoesCallable } from './lib/requisicao';
import { convidar } from './usuarios/convidar';
import { definirPerfis as definirPerfisHandler } from './usuarios/definirPerfis';
import { desativar, reativar } from './usuarios/situacao';

export const convidarUsuario = onCall(opcoesCallable, (req) => convidar(req));
export const definirPerfis = onCall(opcoesCallable, (req) => definirPerfisHandler(req));
export const desativarUsuario = onCall(opcoesCallable, (req) => desativar(req));
export const reativarUsuario = onCall(opcoesCallable, (req) => reativar(req));
