import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'app/core/services/api.service';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ConsumoCaloricoResponse {
    caloriasConsumidas: number;
    agua: number;
    refeicoes: RefeicaoResumo[];
}

export interface RefeicaoResumo {
    id: number;
    nome: string;
    calorias: number;
    horario: string;
    tipo: string;
}

export interface MetasUsuario {
    caloriasDiarias: number;
    aguaDiaria: number;
    pesoMeta: number;
}

export interface EstatisticasSemanais {
    diasComRegistro: number;
    totalRefeicoes: number;
    mediaCaloriasDiarias: number;
    sequenciaAtual: number;
}

@Injectable({
    providedIn: 'root'
})
export class HomeDashboardService {
    private _apiService = inject(ApiService);
    private _httpClient = inject(HttpClient);

    private _consumoDiario = new BehaviorSubject<ConsumoCaloricoResponse>({
        caloriasConsumidas: 0,
        agua: 0,
        refeicoes: []
    });

    private _estatisticasSemanais = new BehaviorSubject<EstatisticasSemanais>({
        diasComRegistro: 0,
        totalRefeicoes: 0,
        mediaCaloriasDiarias: 0,
        sequenciaAtual: 0
    });

    get consumoDiario$(): Observable<ConsumoCaloricoResponse> {
        return this._consumoDiario.asObservable();
    }

    get estatisticasSemanais$(): Observable<EstatisticasSemanais> {
        return this._estatisticasSemanais.asObservable();
    }


    carregarConsumoDiario(): Observable<ConsumoCaloricoResponse> {
        const hoje = new Date().toISOString().split('T')[0];

        return this._apiService.get<ConsumoCaloricoResponse>(`/user/consumo-diario?data=${hoje}`)
            .pipe(
                map(response => {
                    this._consumoDiario.next(response);
                    return response;
                }),
                catchError(error => {
                    console.log('Dados de consumo não disponíveis, usando valores padrão');
                    const dadosDefault = {
                        caloriasConsumidas: 0,
                        agua: 0,
                        refeicoes: []
                    };
                    this._consumoDiario.next(dadosDefault);
                    return of(dadosDefault);
                })
            );
    }


    carregarEstatisticasSemanais(): Observable<EstatisticasSemanais> {
        return this._apiService.get<EstatisticasSemanais>('/user/estatisticas-semanais')
            .pipe(
                map(response => {
                    this._estatisticasSemanais.next(response);
                    return response;
                }),
                catchError(error => {
                    console.log('Estatísticas semanais não disponíveis, usando valores padrão');
                    const dadosDefault = {
                        diasComRegistro: 0,
                        totalRefeicoes: 0,
                        mediaCaloriasDiarias: 0,
                        sequenciaAtual: 0
                    };
                    this._estatisticasSemanais.next(dadosDefault);
                    return of(dadosDefault);
                })
            );
    }


    registrarConsumoAgua(quantidade: number): Observable<any> {
        return this._apiService.post('/user/registrar-agua', { quantidade })
            .pipe(
                map(response => {
                    this.carregarConsumoDiario().subscribe();
                    return response;
                })
            );
    }


    obterProximasRefeicoes(): Observable<RefeicaoResumo[]> {
        return this._apiService.get<RefeicaoResumo[]>('/user/proximas-refeicoes')
            .pipe(
                catchError(error => {
                    console.log('Próximas refeições não disponíveis');
                    return of([]);
                })
            );
    }


    gerarRecomendacoesInteligentes(user: any, consumoDiario: ConsumoCaloricoResponse): any[] {
        const recomendacoes = [];


        const metaAgua = (user.peso || 70) * 35;
        const porcentagemAgua = (consumoDiario.agua / metaAgua) * 100;

        if (porcentagemAgua < 60) {
            recomendacoes.push({
                tipo: 'hidratacao',
                prioridade: 'alta',
                titulo: 'Hidratação insuficiente',
                descricao: `Você está ${Math.round(metaAgua - consumoDiario.agua)}ml abaixo da meta diária de água.`,
                icone: 'water_drop',
                corIcone: 'text-blue-500',
                acao: 'Registrar água'
            });
        }


        const gastoCaloricoTotal = this.calcularGastoCaloricoTotal(user);
        const porcentagemCalorias = (consumoDiario.caloriasConsumidas / gastoCaloricoTotal) * 100;

        if (user.objetivoDieta === 'PERDER_PESO' && porcentagemCalorias > 90) {
            recomendacoes.push({
                tipo: 'nutricional',
                prioridade: 'media',
                titulo: 'Atenção às calorias',
                descricao: 'Você está próximo do limite calórico para seu objetivo de emagrecimento.',
                icone: 'warning',
                corIcone: 'text-orange-500'
            });
        }

        if (consumoDiario.refeicoes.length < 3) {
            recomendacoes.push({
                tipo: 'nutricional',
                prioridade: 'media',
                titulo: 'Registre mais refeições',
                descricao: 'Para um controle mais preciso, registre todas as suas refeições do dia.',
                icone: 'restaurant',
                corIcone: 'text-green-500',
                acao: 'Nova refeição'
            });
        }

        return recomendacoes;
    }

    private calcularGastoCaloricoTotal(user: any): number {
        if (!user.peso || !user.altura || !user.idade || !user.sexo) {
            return 2000;
        }


        let gastoBasal;
        if (user.sexo === 'MASCULINO') {
            gastoBasal = 88.362 + (13.397 * user.peso) + (4.799 * user.altura) - (5.677 * user.idade);
        } else {
            gastoBasal = 447.593 + (9.247 * user.peso) + (3.098 * user.altura) - (4.330 * user.idade);
        }

        const fatores = {
            'SEDENTARIO': 1.2,
            'LEVE': 1.375,
            'MODERADO': 1.55,
            'INTENSO': 1.725,
            'ATLETA': 1.9
        };

        const fator = fatores[user.nivelAtividade] || 1.2;
        return Math.round(gastoBasal * fator);
    }

    obterPlanejamentoSemanal(): Observable<any> {
        return this._apiService.get<any[]>('/api/refeicoes/')
            .pipe(
                map(refeicoes => this.processarPlanejamentoSemanal(refeicoes)),
                catchError(error => {
                    console.log('API não disponível, usando dados de exemplo para planejamento');
                    return of(this.gerarPlanejamentoExemplo());
                })
            );
    }

    private processarPlanejamentoSemanal(refeicoes: any[]): any {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());

        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        const planejamentoSemanal = diasSemana.map((dia, index) => {
            const dataDay = new Date(inicioSemana);
            dataDay.setDate(inicioSemana.getDate() + index);

            const dataFormatada = dataDay.toISOString().split('T')[0];

            const refeicoesDia = refeicoes.filter(refeicao => {
                const dataRefeicao = new Date(refeicao.dataHoraRefeicao);
                const dataRefeicaoFormatada = dataRefeicao.toISOString().split('T')[0];
                return dataRefeicaoFormatada === dataFormatada;
            });

            return {
                dia,
                data: dataDay,
                temPlano: refeicoesDia.length > 0,
                quantidadeRefeicoes: refeicoesDia.length,
                refeicoes: refeicoesDia,
                isHoje: dataFormatada === hoje.toISOString().split('T')[0],
                isPast: dataDay < hoje
            };
        });

        return {
            semana: planejamentoSemanal,
            totalRefeicoes: refeicoes.length,
            diasComPlano: planejamentoSemanal.filter(d => d.temPlano).length
        };
    }

    private gerarPlanejamentoExemplo(): any {
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());

        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        const planejamentoSemanal = diasSemana.map((dia, index) => {
            const dataDay = new Date(inicioSemana);
            dataDay.setDate(inicioSemana.getDate() + index);

            const temPlano = index <= hoje.getDay() && Math.random() > 0.3;
            const quantidadeRefeicoes = temPlano ? Math.floor(Math.random() * 4) + 1 : 0;

            return {
                dia,
                data: dataDay,
                temPlano,
                quantidadeRefeicoes,
                refeicoes: [],
                isHoje: index === hoje.getDay(),
                isPast: index < hoje.getDay()
            };
        });

        return {
            semana: planejamentoSemanal,
            totalRefeicoes: planejamentoSemanal.reduce((sum, d) => sum + d.quantidadeRefeicoes, 0),
            diasComPlano: planejamentoSemanal.filter(d => d.temPlano).length
        };
    }


    carregarEstatisticasSemanaisComDados(): Observable<EstatisticasSemanais> {
        return this._apiService.get<any[]>('/api/refeicoes/')
            .pipe(
                map(refeicoes => {
                    const hoje = new Date();
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                    const fimSemana = new Date(inicioSemana);
                    fimSemana.setDate(inicioSemana.getDate() + 6);

                    const refeicoesSemana = refeicoes.filter(refeicao => {
                        const dataRefeicao = new Date(refeicao.dataHoraRefeicao);
                        return dataRefeicao >= inicioSemana && dataRefeicao <= fimSemana;
                    });

                    const diasComRegistro = new Set(
                        refeicoesSemana.map(r => new Date(r.dataHoraRefeicao).toDateString())
                    ).size;

                    const estatisticas: EstatisticasSemanais = {
                        diasComRegistro,
                        totalRefeicoes: refeicoesSemana.length,
                        mediaCaloriasDiarias: this.calcularMediaCaloriasRefeicoes(refeicoesSemana),
                        sequenciaAtual: this.calcularSequenciaConsecutiva(refeicoes)
                    };

                    this._estatisticasSemanais.next(estatisticas);
                    return estatisticas;
                }),
                catchError(error => {
                    return this.carregarEstatisticasSemanais();
                })
            );
    }

    private calcularMediaCaloriasRefeicoes(refeicoes: any[]): number {
        if (refeicoes.length === 0) return 0;

        const totalCalorias = refeicoes.reduce((sum, refeicao) => {
            return sum + (refeicao.totalCalorias || 0);
        }, 0);

        const diasUnicos = new Set(
            refeicoes.map(r => new Date(r.dataHoraRefeicao).toDateString())
        ).size;

        return diasUnicos > 0 ? Math.round(totalCalorias / diasUnicos) : 0;
    }

    private calcularSequenciaConsecutiva(refeicoes: any[]): number {
        if (refeicoes.length === 0) return 0;

        const datasRefeicoes = refeicoes
            .map(r => new Date(r.dataHoraRefeicao).toDateString())
            .filter((data, index, array) => array.indexOf(data) === index)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        let sequenciaAtual = 0;
        let sequenciaMaxima = 0;
        let dataAnterior: Date | null = null;

        for (const dataStr of datasRefeicoes) {
            const dataAtual = new Date(dataStr);

            if (dataAnterior) {
                const diffDias = Math.floor((dataAtual.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDias === 1) {
                    sequenciaAtual++;
                } else {
                    sequenciaMaxima = Math.max(sequenciaMaxima, sequenciaAtual);
                    sequenciaAtual = 1;
                }
            } else {
                sequenciaAtual = 1;
            }

            dataAnterior = dataAtual;
        }

        return Math.max(sequenciaMaxima, sequenciaAtual);
    }

    gerarInsightsPlanejamento(planejamento: any): any[] {
        const insights = [];
        const { semana, diasComPlano, totalRefeicoes } = planejamento;

        if (diasComPlano < 3) {
            insights.push({
                tipo: 'planejamento',
                prioridade: 'alta',
                titulo: 'Planeje mais dias da semana',
                descricao: `Você tem planos alimentares para apenas ${diasComPlano} dias esta semana.`,
                icone: 'event_note',
                corIcone: 'text-orange-500'
            });
        }

        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const diaOntem = semana.find(d => d.data.toDateString() === ontem.toDateString());

        if (diaOntem && !diaOntem.temPlano) {
            insights.push({
                tipo: 'registro',
                prioridade: 'media',
                titulo: 'Registre as refeições de ontem',
                descricao: 'Não encontramos registros de refeições do dia anterior.',
                icone: 'history',
                corIcone: 'text-blue-500'
            });
        }

        if (totalRefeicoes > 20) {
            insights.push({
                tipo: 'motivacao',
                prioridade: 'baixa',
                titulo: 'Excelente consistência!',
                descricao: `Parabéns! Você já registrou ${totalRefeicoes} refeições esta semana.`,
                icone: 'celebration',
                corIcone: 'text-green-500'
            });
        }

        return insights;
    }
}
