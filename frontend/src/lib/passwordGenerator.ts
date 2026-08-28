// Generador simple de contraseñas para ayudar al superadmin cuando elige
// definirla el mismo en vez de mandar una invitación. No pretende ser
// criptográficamente perfecto, solo práctico: legible, sin caracteres
// ambiguos (0/O, 1/l/I), y con al menos una mayúscula/minúscula/número.
const LETTERS_LOWER = "abcdefghjkmnpqrstuvwxyz";
const LETTERS_UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";

function pick(pool: string): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generatePassword(length = 10): string {
  const pool = LETTERS_LOWER + LETTERS_UPPER + DIGITS;
  const chars = [pick(LETTERS_LOWER), pick(LETTERS_UPPER), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(pool));

  // Barajar (Fisher-Yates) para que las posiciones fijas no sean siempre
  // minuscula/mayuscula/numero en el mismo orden.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
