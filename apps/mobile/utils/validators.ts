export function isValidCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

export function isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned.charAt(12)) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned.charAt(13)) !== digit2) return false;

    return true;
}

export function isValidDocument(doc: string): boolean {
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) return isValidCPF(cleaned);
    if (cleaned.length === 14) return isValidCNPJ(cleaned);
    return false;
}

export function formatCPFCNPJ(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
        return cleaned
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongPassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
        return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'A senha deve conter ao menos uma letra maiúscula.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'A senha deve conter ao menos um número.' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { valid: false, message: 'A senha deve conter ao menos um caractere especial.' };
    }
    return { valid: true, message: '' };
}

export function formatPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
        return cleaned
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
