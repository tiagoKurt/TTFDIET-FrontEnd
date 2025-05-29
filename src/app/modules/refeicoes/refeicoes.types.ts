export interface RefeicaoRequest {
    objetivo: string;
    peso?: number;
    gasto_calorico_basal?: number;
    refeicao: string;
    preferencias: string[];
    maximo_calorias_por_refeicao: number;
}

export interface AlimentoResponse {
    nome: string;
    quantidade: number;
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gordura: number;
    unidade_medida: string;
    mensagem: string;
}

export interface PlanoAlimentarResponse {
    plano_alimentar_semanal: {
        [refeicao: string]: {
            [dia: string]: AlimentoResponse[];
        };
    };
}

export type TipoRefeicao = 'Café da manhã' | 'Almoço' | 'Lanche da tarde' | 'Jantar' | 'Lanche da noite';

export type TipoObjetivo = 'perder peso' | 'manter peso' | 'ganhar massa';

export interface PreferenciasRefeicao {
    predefinidas: string[];
    personalizadas: string[];
}
