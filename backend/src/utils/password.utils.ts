import bcrypt from 'bcryptjs';

// Генерация случайного пароля
export function generatePassword(length: number = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Убедимся, что пароль содержит хотя бы одну заглавную, одну строчную, одну цифру и один спецсимвол
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
    // Если не все требования выполнены, генерируем заново
    return generatePassword(length);
  }
  
  return password;
}

// Хеширование пароля
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Проверка пароля
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}