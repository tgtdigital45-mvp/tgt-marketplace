import {
    isValidCPF,
    isValidCNPJ,
    isValidDocument,
    isValidEmail,
    isStrongPassword,
    formatCPFCNPJ,
    formatPhone,
} from '../utils/validators';

describe('isValidCPF', () => {
    it('aceita CPF válido', () => {
        expect(isValidCPF('529.982.247-25')).toBe(true);
    });
    it('rejeita CPF com todos dígitos iguais', () => {
        expect(isValidCPF('111.111.111-11')).toBe(false);
    });
    it('rejeita CPF com tamanho errado', () => {
        expect(isValidCPF('123.456.789')).toBe(false);
    });
    it('rejeita CPF inválido', () => {
        expect(isValidCPF('000.000.000-00')).toBe(false);
    });
});

describe('isValidCNPJ', () => {
    it('aceita CNPJ válido', () => {
        expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    });
    it('rejeita CNPJ com todos dígitos iguais', () => {
        expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    });
    it('rejeita CNPJ com tamanho errado', () => {
        expect(isValidCNPJ('11.222.333')).toBe(false);
    });
});

describe('isValidDocument', () => {
    it('valida CPF corretamente', () => {
        expect(isValidDocument('529.982.247-25')).toBe(true);
    });
    it('valida CNPJ corretamente', () => {
        expect(isValidDocument('11.222.333/0001-81')).toBe(true);
    });
    it('rejeita documento de tamanho inválido', () => {
        expect(isValidDocument('123')).toBe(false);
    });
});

describe('isValidEmail', () => {
    it('aceita email válido', () => {
        expect(isValidEmail('usuario@contratto.app')).toBe(true);
    });
    it('rejeita email sem @', () => {
        expect(isValidEmail('usuariocontratto.app')).toBe(false);
    });
    it('rejeita email sem domínio', () => {
        expect(isValidEmail('usuario@')).toBe(false);
    });
    it('ignora espaços nas bordas', () => {
        expect(isValidEmail('  usuario@contratto.app  ')).toBe(true);
    });
});

describe('isStrongPassword', () => {
    it('aceita senha forte', () => {
        const result = isStrongPassword('Senha@123');
        expect(result.valid).toBe(true);
    });
    it('rejeita senha curta', () => {
        const result = isStrongPassword('Ab@1');
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/8 caracteres/);
    });
    it('rejeita senha sem maiúscula', () => {
        const result = isStrongPassword('senha@123');
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/maiúscula/);
    });
    it('rejeita senha sem número', () => {
        const result = isStrongPassword('Senha@abc');
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/número/);
    });
    it('rejeita senha sem caractere especial', () => {
        const result = isStrongPassword('Senha1234');
        expect(result.valid).toBe(false);
        expect(result.message).toMatch(/especial/);
    });
});

describe('formatCPFCNPJ', () => {
    it('formata CPF', () => {
        expect(formatCPFCNPJ('52998224725')).toBe('529.982.247-25');
    });
    it('formata CNPJ', () => {
        expect(formatCPFCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
});

describe('formatPhone', () => {
    it('formata celular com 11 dígitos', () => {
        expect(formatPhone('11999887766')).toBe('(11) 99988-7766');
    });
    it('formata telefone fixo com 10 dígitos', () => {
        expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });
});
