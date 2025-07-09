// src/services/validationService.js
// Sistema de Validação Profissional para Dados do Cliente

class ValidationService {
    
    // Valida nome completo (nome + sobrenome)
    static validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Nome não informado' };
        }
        
        const cleanName = name.trim();
        
        // Mínimo 2 caracteres, máximo 100
        if (cleanName.length < 2) {
            return { valid: false, error: 'Nome muito curto' };
        }
        
        if (cleanName.length > 100) {
            return { valid: false, error: 'Nome muito longo' };
        }
        
        // Apenas letras, espaços e acentos
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
        if (!nameRegex.test(cleanName)) {
            return { valid: false, error: 'Nome deve conter apenas letras' };
        }
        
        // Pelo menos duas palavras (nome e sobrenome)
        const words = cleanName.split(' ').filter(word => word.length > 0);
        if (words.length < 2) {
            return { valid: false, error: 'Por favor, informe nome e sobrenome' };
        }
        
        return { 
            valid: true, 
            value: cleanName,
            firstName: words[0],
            lastName: words.slice(1).join(' ')
        };
    }

    // Valida formato de e-mail
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'E-mail não informado' };
        }
        
        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(cleanEmail)) {
            return { valid: false, error: 'Formato de e-mail inválido' };
        }
        
        return { valid: true, value: cleanEmail };
    }

    // Valida telefone brasileiro
    static validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return { valid: false, error: 'Telefone não informado' };
        }
        
        // Remove tudo que não é número
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Celular (11 dígitos com DDD)
        if (cleanPhone.length === 11) {
            const ddd = cleanPhone.substring(0, 2);
            const firstDigit = cleanPhone.charAt(2);
            
            // Valida DDD válido (11-99)
            if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && firstDigit === '9') {
                return {
                    valid: true,
                    value: cleanPhone,
                    formatted: `(${ddd}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`
                };
            }
        }
        
        // Telefone fixo (10 dígitos)
        if (cleanPhone.length === 10) {
            const ddd = cleanPhone.substring(0, 2);
            
            if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
                return {
                    valid: true,
                    value: cleanPhone,
                    formatted: `(${ddd}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`
                };
            }
        }
        
        return { valid: false, error: 'Telefone deve ter formato (85) 99999-9999' };
    }

    // Valida endereço completo
    static validateAddress(addressText) {
        if (!addressText || typeof addressText !== 'string') {
            return { valid: false, error: 'Endereço não informado' };
        }

        const address = addressText.trim();
        
        if (address.length < 10) {
            return { valid: false, error: 'Endereço muito curto. Informe: rua, número, bairro, cidade' };
        }

        // Verifica se tem pelo menos vírgula ou quebra de linha
        if (!address.includes(',') && !address.includes('\n')) {
            return { valid: false, error: 'Por favor, separe os dados do endereço com vírgulas' };
        }

        return { valid: true, value: address };
    }

    // Valida momento do pagamento (1ª escolha)
    static validatePaymentTiming(choice) {
        const option = choice.toString().trim().toLowerCase();
        
        if (option === '1' || option.includes('agora') || option.includes('online')) {
            return { valid: true, timing: 'now', label: 'Pagar agora (online)' };
        }
        
        if (option === '2' || option.includes('entrega') || option.includes('entregar')) {
            return { valid: true, timing: 'delivery', label: 'Pagar na entrega' };
        }
        
        return { 
            valid: false, 
            error: 'Opção inválida. Digite:\n1 - Pagar agora\n2 - Pagar na entrega' 
        };
    }

    // Valida forma de pagamento online (se escolheu "agora")
    static validateOnlinePayment(choice) {
        const option = choice.toString().trim().toLowerCase();
        
        if (option === '1' || option.includes('pix')) {
            return { valid: true, method: 'pix', label: 'PIX' };
        }
        
        if (option === '2' || option.includes('cartao') || option.includes('cartão')) {
            return { valid: true, method: 'card_online', label: 'Cartão de crédito/débito' };
        }
        
        return { 
            valid: false, 
            error: 'Opção inválida. Digite:\n1 - PIX\n2 - Cartão de crédito/débito' 
        };
    }

    // Valida forma de pagamento na entrega (se escolheu "entrega")
    static validateDeliveryPayment(choice) {
        const option = choice.toString().trim().toLowerCase();
        
        if (option === '1' || option.includes('cartao') || option.includes('cartão')) {
            return { valid: true, method: 'card_delivery', label: 'Cartão (maquininha na entrega)' };
        }
        
        if (option === '2' || option.includes('dinheiro')) {
            return { valid: true, method: 'cash', label: 'Dinheiro' };
        }
        
        return { 
            valid: false, 
            error: 'Opção inválida. Digite:\n1 - Cartão (maquininha)\n2 - Dinheiro' 
        };
    }

    // Valida valor do troco (se escolheu dinheiro)
    static validateChange(value, orderTotal) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: 'Valor não informado' };
        }

        // Remove R$, espaços e converte vírgula para ponto
        const cleanValue = value.replace(/R\$\s?/, '').replace(',', '.').trim();
        const numericValue = parseFloat(cleanValue);

        if (isNaN(numericValue)) {
            return { valid: false, error: 'Valor inválido. Ex: R$ 100 ou 100' };
        }

        if (numericValue < orderTotal) {
            return { 
                valid: false, 
                error: `Valor deve ser maior que R$ ${orderTotal.toFixed(2).replace('.', ',')}` 
            };
        }

        const change = numericValue - orderTotal;
        
        return { 
            valid: true, 
            paymentValue: numericValue,
            changeValue: change,
            formatted: `R$ ${numericValue.toFixed(2).replace('.', ',')}`
        };
    }

    // Valida se texto é comando global
    static isCommand(text) {
        const commands = [
            'cancelar', 'cancel', 'sair', 'pare', 'parar',
            'menu', 'cardapio', 'cardápio',
            'ajuda', 'help', 'opcoes', 'opções',
            'atendente', 'humano', 'suporte'
        ];
        
        return commands.includes(text.toLowerCase().trim());
    }

    // Sanitiza texto removendo caracteres perigosos
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '')
            .substring(0, 500);
    }
}

module.exports = ValidationService;
