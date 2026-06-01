/**
 * Форматирует полный номер телефона (11 цифр, начиная с 7) для отображения
 * @param {string} fullPhone - полный номер вида 79991234567
 * @returns {string} отформатированная строка +7 (XXX) XXX-XX-XX
 */
export function formatPhone(fullPhone) {
  if (!fullPhone) return ''
  const digits = fullPhone.replace(/\D/g, '')
  
  // Ожидаем 11 цифр, начинающихся с 7
  if (digits.length === 11 && digits.startsWith('7')) {
    const phoneDigits = digits.slice(1) // убираем код страны
    return `+7 (${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 8)}-${phoneDigits.slice(8, 10)}`
  }
  
  // Если формат не совсем тот, пробуем отформатировать последние 10 цифр
  const lastTen = digits.slice(-10)
  if (lastTen.length === 10) {
    return `+7 (${lastTen.slice(0, 3)}) ${lastTen.slice(3, 6)}-${lastTen.slice(6, 8)}-${lastTen.slice(8, 10)}`
  }
  
  return fullPhone // fallback
}
