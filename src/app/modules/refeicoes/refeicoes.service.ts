import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RefeicaoRequest, AlimentoResponse, PlanoAlimentarResponse } from './refeicoes.types';

@Injectable({
    providedIn: 'root'
})
export class RefeicoesService {
    private _httpClient = inject(HttpClient);

    private readonly REFEICAO_URL = 'https://agenteia.tigasolutions.com.br/refeicao';
    private readonly PLANO_URL = 'https://agenteia.tigasolutions.com.br/plano';

    gerarRefeicao(request: RefeicaoRequest): Observable<AlimentoResponse[]> {
        return this._httpClient.post<AlimentoResponse[]>(this.REFEICAO_URL, request);
    }

    gerarPlanoAlimentar(request: RefeicaoRequest): Observable<PlanoAlimentarResponse> {
        return this._httpClient.post<PlanoAlimentarResponse>(this.PLANO_URL, request);
    }

    calcularGastoCalorico(peso: number, altura: number, idade: number, sexo: string, nivelAtividade: string): number {
        let gastoBsal: number;

        if (sexo === 'MASCULINO') {
            gastoBsal = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
        } else {
            gastoBsal = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
        }

        const multiplicadores: { [key: string]: number } = {
            'SEDENTARIO': 1.2,
            'LEVE': 1.375,
            'MODERADO': 1.55,
            'INTENSO': 1.725,
            'ATLETA': 1.9
        };

        return Math.round(gastoBsal * (multiplicadores[nivelAtividade] || 1.2));
    }

    getPreferenciasPadrao(tipoRefeicao: string): string[] {
        const preferencias: { [key: string]: string[] } = {
            'Café da manhã': [
                'Ovos',
                'Pão integral',
                'Frutas',
                'Iogurte',
                'Aveia',
                'Granola',
                'Café',
                'Suco natural'
            ],
            'Almoço': [
                'Frango',
                'Carne vermelha',
                'Peixe',
                'Arroz integral',
                'Feijão',
                'Salada',
                'Legumes',
                'Massa integral'
            ],
            'Lanche da tarde': [
                'Frutas',
                'Castanhas',
                'Iogurte',
                'Biscoito integral',
                'Vitamina',
                'Sanduíche natural',
                'Queijo',
                'Chá'
            ],
            'Jantar': [
                'Sopa',
                'Salada',
                'Frango grelhado',
                'Peixe',
                'Legumes',
                'Omelete',
                'Quinoa',
                'Batata doce'
            ],
            'Lanche da noite': [
                'Chá',
                'Frutas leves',
                'Iogurte natural',
                'Castanhas',
                'Biscoito integral',
                'Leite',
                'Aveia',
                'Mel'
            ]
        };

        return preferencias[tipoRefeicao] || [];
    }
}
