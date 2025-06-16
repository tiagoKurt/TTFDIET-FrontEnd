export interface RefeicaoRequest {
    objetivo: string;
    peso?: number;
    gasto_calorico_basal?: number;
    refeicao: string;
    preferencias: string[];
    maximo_calorias_por_refeicao: number;
}

export interface AlimentoResponse {
    id?: number;
    nome: string;
    quantidade: number;
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gordura: number;
    unidade_medida: string;
    mensagem: string;
}

export interface RefeicaoResponse {
    id: number;
    nome: string;
    observacao: string;
    dataHoraRefeicao: string;
    status: StatusRefeicao;
    alimentos: AlimentoResponse[];
}

export interface PlanoAlimentarDetalhado {
    id: number;
    objetivo: string;
    pesoUsuario: number;
    gastoCaloricoBasalUsuario: number;
    preferenciasUsuario: string[];
    maximoCaloriasPorRefeicaoUsuario: number;
    tipoRefeicaoSolicitada: string;
    dataCriacao: string;
    refeicoes: RefeicaoResponse[];
}

export interface AlimentoUpdate {
    id: number;
    nome: string;
    quantidade: number;
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gordura: number;
    unidade_medida: string;
    mensagem: string;
}

export interface AlimentoListItem {
    nome: string;
    calorias_por_100g: number;
    proteinas_por_100g: number;
    carboidratos_por_100g: number;
    gordura_por_100g: number;
}

export interface PlanoAlimentarResponse {
    plano_alimentar_semanal: {
        [refeicao: string]: {
            [dia: string]: AlimentoResponse[];
        };
    };
}

export interface StatusRefeicaoDTO {
    status: StatusRefeicao;
}

export interface VerificarPendenteResponse {
    temPendente: boolean;
}

export type TipoRefeicao = 'Café da manhã' | 'Almoço' | 'Lanche da tarde' | 'Jantar' | 'Lanche da noite';

export type TipoObjetivo = 'perder peso' | 'manter peso' | 'ganhar massa';

export type StatusRefeicao = 'AGUARDANDO' | 'ACEITA' | 'REJEITADA';

export interface PreferenciasRefeicao {
    predefinidas: string[];
    personalizadas: string[];
}
