export const formatWhatsApp = (value: string | null | undefined) => {
    if (!value) return '';

    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Limita a 11 dígitos
    const truncated = numbers.slice(0, 11);

    // Aplica a máscara (XX) XXXXX-XXXX
    if (truncated.length <= 2) {
        return truncated;
    } else if (truncated.length <= 7) {
        return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
    } else {
        return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
    }
};

export const cleanWhatsApp = (value: string) => {
    return value.replace(/\D/g, '');
};
