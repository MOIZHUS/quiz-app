/**
 * Caesar cipher encryption for the quiz notes field.
 * Shift each character code by +3 on save, -3 on read.
 * This ensures notes are never stored in plain text.
 */

export function encrypt(str: string, shift = 3): string {
  return str
    .split('')
    .map((char) => String.fromCharCode(char.charCodeAt(0) + shift))
    .join('')
}

export function decrypt(str: string, shift = 3): string {
  return str
    .split('')
    .map((char) => String.fromCharCode(char.charCodeAt(0) - shift))
    .join('')
}
