import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'app/core/services/api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Meta } from './metas.component';

export interface MetaRequest {
    tipoMeta: 'PESO' | 'AGUA' | 'CALORIAS';
    valorAtual?: number;
    valorMeta: number;
    completa?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MetasService {
    private _apiService = inject(ApiService);
    private _httpClient = inject(HttpClient);

    listarMetas(): Observable<Meta[]> {
        return this._apiService.get<Meta[]>('/api/metas/')
            .pipe(
                catchError(error => {
                    console.log('Metas não disponíveis, usando dados de exemplo');
                    return of([
                        {
                            id: 1,
                            tipoMeta: 'PESO' as const,
                            valorAtual: 75,
                            valorMeta: 70,
                            completa: false
                        },
                        {
                            id: 2,
                            tipoMeta: 'AGUA' as const,
                            valorAtual: 1500,
                            valorMeta: 2500,
                            completa: false
                        },
                        {
                            id: 3,
                            tipoMeta: 'CALORIAS' as const,
                            valorAtual: 1800,
                            valorMeta: 2000,
                            completa: false
                        }
                    ]);
                })
            );
    }

    buscarMetaPorId(id: number): Observable<Meta> {
        return this._apiService.get<Meta>(`/api/metas/${id}`)
            .pipe(
                catchError(error => {
                    console.error('Erro ao buscar meta:', error);
                    throw error;
                })
            );
    }

    criarMeta(metaRequest: MetaRequest): Observable<Meta> {
        return this._apiService.post<Meta>('/api/metas/', metaRequest)
            .pipe(
                catchError(error => {
                    console.error('Erro ao criar meta:', error);
                    throw error;
                })
            );
    }

    atualizarMeta(id: number, metaRequest: MetaRequest): Observable<Meta> {
        return this._apiService.put<Meta>(`/api/metas/${id}`, metaRequest)
            .pipe(
                catchError(error => {
                    console.error('Erro ao atualizar meta:', error);
                    throw error;
                })
            );
    }

    excluirMeta(id: number): Observable<void> {
        return this._apiService.delete<void>(`/api/metas/${id}`)
            .pipe(
                catchError(error => {
                    console.error('Erro ao excluir meta:', error);
                    throw error;
                })
            );
    }

    atualizarProgresso(id: number, valorAtual: number): Observable<Meta> {
        return this._apiService.post<Meta>(`/api/metas/${id}/atualizar-progresso`, { valorAtual })
            .pipe(
                catchError(error => {
                    console.error('Erro ao atualizar progresso:', error);
                    throw error;
                })
            );
    }

    obterResumoMetas(): Observable<any> {
        return this._apiService.get<any>('/api/metas/resumo')
            .pipe(
                catchError(error => {
                    console.log('Resumo de metas não disponível');
                    return of({
                        totalMetas: 0,
                        metasCompletas: 0,
                        metasEmAndamento: 0,
                        ultimaAtualizacao: new Date().toISOString()
                    });
                })
            );
    }

    obterProgressoMetas(): Observable<any> {
        return this._apiService.get<any>('/api/metas/progresso')
            .pipe(
                catchError(error => {
                    console.log('Progresso de metas não disponível');
                    return of({});
                })
            );
    }

    obterRecomendacoesMetas(): Observable<any[]> {
        return this.listarMetas().pipe(
            map(metas => {
                const recomendacoes = [];

                metas.forEach(meta => {
                    const progresso = (meta.valorAtual / meta.valorMeta) * 100;

                    if (meta.tipoMeta === 'AGUA' && progresso < 50) {
                        recomendacoes.push({
                            tipo: 'hidratacao',
                            prioridade: 'alta',
                            titulo: 'Aumente sua hidratação',
                            descricao: `Você está consumindo apenas ${meta.valorAtual}ml dos ${meta.valorMeta}ml recomendados.`,
                            meta: meta
                        });
                    }

                    if (meta.tipoMeta === 'PESO' && !meta.completa) {
                        const diferenca = Math.abs(meta.valorAtual - meta.valorMeta);
                        recomendacoes.push({
                            tipo: 'peso',
                            prioridade: 'media',
                            titulo: 'Continue focado na sua meta de peso',
                            descricao: `Você está a ${diferenca.toFixed(1)}kg da sua meta.`,
                            meta: meta
                        });
                    }

                    if (meta.tipoMeta === 'CALORIAS' && progresso > 90) {
                        recomendacoes.push({
                            tipo: 'calorias',
                            prioridade: 'baixa',
                            titulo: 'Meta de calorias quase atingida',
                            descricao: 'Parabéns! Você está muito próximo da sua meta calórica diária.',
                            meta: meta
                        });
                    }
                });

                return recomendacoes;
            })
        );
    }
}
