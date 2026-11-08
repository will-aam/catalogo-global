/**
 * Utilitários oficiais para manipulação, validação e formatação de códigos NCM
 * Padrão brasileiro/Mercosul: 8 dígitos numéricos estruturados como XXXX.XX.XX
 */

/**
 * Aplica máscara dinâmica de NCM (XXXX.XX.XX) em tempo real durante a digitação.
 * O usuário apenas digita os números e os pontos são inseridos automaticamente.
 */
export function maskNcm(val: string | null | undefined): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

export function formatNcm(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // Se já está no formato padrão correto XXXX.XX.XX
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  // Caso comum de importações de planilhas Excel onde o '0' à esquerda foi cortado
  if (digits.length === 7) {
    digits = "0" + digits;
  }

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  }

  return trimmed;
}

export function cleanNcm(val: string | null | undefined): string | null {
  if (!val) return null;
  let digits = val.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 7) {
    digits = "0" + digits;
  }
  return digits;
}

/**
 * Valida se um código NCM é estritamente válido: exatamente 8 dígitos numéricos válidos.
 */
export function isValidNcm(val: string | null | undefined): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, "");
  return digits.length === 8 && digits !== "00000000";
}

/**
 * Verifica se o NCM foi digitado parcialmente (incompleto, menos de 8 dígitos).
 */
export function isPartialNcm(val: string | null | undefined): boolean {
  if (!val || !val.trim()) return false;
  const digits = val.replace(/\D/g, "");
  return digits.length > 0 && digits.length !== 8;
}

export function isFormattedNcm(val: string | null | undefined): boolean {
  if (!val) return false;
  return /^\d{4}\.\d{2}\.\d{2}$/.test(val.trim());
}

export function isIncorrectNcm(val: string | null | undefined): boolean {
  if (!val || !val.trim()) return false;
  const trimmed = val.trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits.length !== 8 || !/^\d{4}\.\d{2}\.\d{2}$/.test(trimmed);
}
