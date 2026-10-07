// Regras numericas de dominio compartilhadas: o web usa para UX, a API para validar.

/** Quantidade maxima de um mesmo EPI numa entrega (limite herdado do legado). */
export const MAX_ITEM_QUANTITY = 50;
/** Quantidade maxima de itens distintos numa entrega. */
export const MAX_DELIVERY_ITEMS = 20;
/** Limite de caracteres da observacao por item (igual ao legado). */
export const ITEM_NOTES_MAX_LENGTH = 200;
export const DELIVERY_NOTES_MAX_LENGTH = 500;
/** Tamanho maximo da imagem de assinatura (PNG) em bytes, apos decodificar o base64. */
export const SIGNATURE_MAX_BYTES = 300 * 1024;
export const PASSWORD_MIN_LENGTH = 10;
export const PAGE_SIZE_MAX = 100;

/** Valida CPF (11 digitos + digitos verificadores). Recebe apenas digitos. */
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  const check = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (digits[i] ?? 0) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === digits[9] && check(10) === digits[10];
}

/** "12345678901" -> "***.456.789-**" (exibicao para quem nao precisa do CPF completo). */
export function maskCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}
