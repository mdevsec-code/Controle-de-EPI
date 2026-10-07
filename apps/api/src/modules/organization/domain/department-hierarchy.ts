/**
 * Verifica se definir `newParentId` como pai de `departmentId` criaria um ciclo.
 * `parentOf` devolve o pai atual de um setor (ou null na raiz).
 */
export async function createsCycle(
  departmentId: string,
  newParentId: string,
  parentOf: (id: string) => Promise<string | null>,
): Promise<boolean> {
  const visited = new Set<string>();
  let current: string | null = newParentId;
  while (current) {
    if (current === departmentId) return true;
    if (visited.has(current)) return true; // ciclo preexistente: nao piorar
    visited.add(current);
    current = await parentOf(current);
  }
  return false;
}
