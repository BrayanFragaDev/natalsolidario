import { onCall } from 'firebase-functions/v2/https';
import { opcoesCallable } from './lib/requisicao';
import { convidar } from './usuarios/convidar';

export const convidarUsuario = onCall(opcoesCallable, (req) => convidar(req));
