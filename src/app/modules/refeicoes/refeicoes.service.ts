import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RefeicaoRequest, AlimentoResponse, PlanoAlimentarResponse, RefeicaoResponse, AlimentoUpdate, AlimentoListItem, PlanoAlimentarDetalhado } from './refeicoes.types';

@Injectable({
    providedIn: 'root'
})
export class RefeicoesService {
    private _httpClient = inject(HttpClient);

    private readonly REFEICAO_URL = 'https://agenteia.tigasolutions.com.br/refeicao';
    private readonly PLANO_URL = 'http://localhost:8080/api/planos/gerar';
    private readonly PLANO_SALVAR_URL = 'http://localhost:8080/api/planos/gerar-e-salvar';
    private readonly PLANOS_URL = 'http://localhost:8080/api/planos';
    private readonly BACKEND_URL = 'http://localhost:8080/api/refeicoes';
    private readonly ALIMENTOS_URL = 'http://localhost:8080/api/alimentos';
    private readonly MINHAS_REFEICOES_URL = 'http://localhost:8080/api/minhas-refeicoes';

    gerarRefeicao(request: RefeicaoRequest): Observable<AlimentoResponse[]> {
        return this._httpClient.post<AlimentoResponse[]>(this.REFEICAO_URL, request);
    }

    gerarESalvarRefeicao(request: RefeicaoRequest): Observable<RefeicaoResponse> {
        return this._httpClient.post<RefeicaoResponse>(`${this.BACKEND_URL}/gerar-e-salvar`, request);
    }

    excluirRefeicao(refeicaoId: number): Observable<void> {
        return this._httpClient.delete<void>(`${this.BACKEND_URL}/${refeicaoId}`);
    }

    excluirMinhaRefeicao(refeicaoId: number): Observable<void> {
        return this._httpClient.delete<void>(`${this.MINHAS_REFEICOES_URL}/${refeicaoId}`);
    }

    excluirPlano(planoId: number): Observable<void> {
        return this._httpClient.delete<void>(`${this.PLANOS_URL}/${planoId}`);
    }

    atualizarAlimento(refeicaoId: number, alimentoUpdate: AlimentoUpdate): Observable<AlimentoResponse> {
        return this._httpClient.put<AlimentoResponse>(`${this.BACKEND_URL}/${refeicaoId}/alimentos/${alimentoUpdate.id}`, alimentoUpdate);
    }

    listarAlimentos(): Observable<AlimentoListItem[]> {
        return this._httpClient.get<AlimentoListItem[]>(`${this.ALIMENTOS_URL}/lista`);
    }

    listarPlanos(): Observable<PlanoAlimentarDetalhado[]> {
        return this._httpClient.get<PlanoAlimentarDetalhado[]>(this.PLANOS_URL);
    }

    buscarPlano(id: number): Observable<PlanoAlimentarDetalhado> {
        return this._httpClient.get<PlanoAlimentarDetalhado>(`${this.PLANOS_URL}/${id}`);
    }

    atualizarAlimentoPlano(planoId: number, refeicaoId: number, alimentoUpdate: AlimentoUpdate): Observable<AlimentoResponse> {
        return this._httpClient.put<AlimentoResponse>(`${this.PLANOS_URL}/${planoId}/refeicoes/${refeicaoId}/alimentos/${alimentoUpdate.id}`, alimentoUpdate);
    }

    listarMinhasRefeicoes(): Observable<RefeicaoResponse[]> {
        return this._httpClient.get<RefeicaoResponse[]>(this.MINHAS_REFEICOES_URL);
    }

    buscarMinhaRefeicao(id: number): Observable<RefeicaoResponse> {
        return this._httpClient.get<RefeicaoResponse>(`${this.MINHAS_REFEICOES_URL}/${id}`);
    }

    atualizarAlimentoMinhasRefeicoes(refeicaoId: number, alimentoUpdate: AlimentoUpdate): Observable<AlimentoResponse> {
        return this._httpClient.put<AlimentoResponse>(`${this.MINHAS_REFEICOES_URL}/${refeicaoId}/alimentos/${alimentoUpdate.id}`, alimentoUpdate);
    }

    excluirAlimentoRefeicao(refeicaoId: number, alimentoId: number): Observable<void> {
        return this._httpClient.delete<void>(`${this.BACKEND_URL}/${refeicaoId}/alimentos/${alimentoId}`);
    }

    excluirAlimentoMinhasRefeicoes(refeicaoId: number, alimentoId: number): Observable<void> {
        return this._httpClient.delete<void>(`${this.MINHAS_REFEICOES_URL}/${refeicaoId}/alimentos/${alimentoId}`);
    }

    buscarRefeicoesPorData(dataInicio: string, dataFim: string): Observable<RefeicaoResponse[]> {
        return this._httpClient.get<RefeicaoResponse[]>(`${this.BACKEND_URL}/por-data`, {
            params: {
                dataInicio: dataInicio,
                dataFim: dataFim
            }
        });
    }

    buscarRefeicoesPorDia(data: string): Observable<RefeicaoResponse[]> {
        return this._httpClient.get<RefeicaoResponse[]>(`${this.BACKEND_URL}/por-dia`, {
            params: {
                data: data
            }
        });
    }

    gerarPlanoAlimentar(request: RefeicaoRequest): Observable<PlanoAlimentarResponse> {
        return this._httpClient.post<PlanoAlimentarResponse>(this.PLANO_URL, request);
    }

    gerarPlanoAlimentarSemanal(request: RefeicaoRequest): Observable<PlanoAlimentarResponse> {
        return this._httpClient.post<PlanoAlimentarResponse>(`${this.PLANO_SALVAR_URL}/semanal`, request);
    }

    adicionarRefeicao(refeicao: any): Observable<RefeicaoResponse> {
        return this._httpClient.post<RefeicaoResponse>(this.BACKEND_URL, refeicao);
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
