
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj || typeof cnpj !== 'string') return false;

  cnpj = cnpj.replace(/[^\d]+/g, '');

  if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
};

export const validateCPF = (cpf: string): boolean => {
  if (!cpf || typeof cpf !== 'string') return false;
  
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf.substring(10, 11), 10);
};

export const validatePassword = (password: string): boolean => {
    if (!password || typeof password !== 'string') return false;
    // Mínimo 8 caracteres, pelo menos 1 letra e 1 número
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{8,}$/;
    return regex.test(password);
}
