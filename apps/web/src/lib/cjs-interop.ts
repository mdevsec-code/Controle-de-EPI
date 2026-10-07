/**
 * Pacotes CommonJS com `exports.default` (ex.: react-signature-canvas, qrcode) chegam ao codigo
 * embrulhados ou nao, conforme o bundler/ambiente (Vite dev, build com rolldown, Vitest).
 * Normaliza para o valor real em vez de depender desse detalhe.
 */
export function cjsDefault<T>(module: T): T {
  const wrapped = module as T & { default?: T };
  return wrapped.default ?? module;
}
