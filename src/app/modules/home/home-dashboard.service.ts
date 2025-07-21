import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiService } from 'app/core/services/api.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    totalPendentes?: number;
}

export interface PlanejamentoSemanal {
    semana: DiaSemanaPlanejamento[];
    totalRefeicoes: number;
    diasPlanejados: number;
}

export interface DiaSemanaPlanejamento {
    diaSemana: string;
    diaNumero: number;
    data: string;
    temPlano: boolean;
    quantidadeRefeicoes: number;
    isHoje: boolean;
    isPast: boolean;
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

    carregarRefeicoesPendentes(): Observable<number> {
        return this._httpClient.get<{totalPendentes: number}>('https://ttfdietbackend.tigasolutions.com.br/api/refeicoes/contar-pendentes')
            .pipe(
                map(response => response.totalPendentes),
                catchError(error => {
                    return of(0);
                })
            );
    }

    obterPlanejamentoSemanalMelhorado(): Observable<PlanejamentoSemanal> {
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        return this.buscarRefeicoesSemanaAtual().pipe(
            map(refeicoes => {
                const refeicoesAceitas = refeicoes.filter(r => r.status === 'ACEITA');
                const semana: DiaSemanaPlanejamento[] = [];

                for (let i = 0; i < 7; i++) {
                    const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);

                    const refeicoesNoDia = refeicoesAceitas.filter(r => {
                        const dataRefeicao = new Date(r.dataHoraRefeicao);

                        const dataRefeicaoLocal = new Date(
                            dataRefeicao.getFullYear(),
                            dataRefeicao.getMonth(),
                            dataRefeicao.getDate()
                        );

                        const dataComparacao = new Date(
                            data.getFullYear(),
                            data.getMonth(),
                            data.getDate()
                        );

                        return dataRefeicaoLocal.getTime() === dataComparacao.getTime();
                    });

                    semana.push({
                        diaSemana: diasSemana[data.getDay()],
                        diaNumero: data.getDate(),
                        data: data.toISOString().split('T')[0],
                        temPlano: refeicoesNoDia.length > 0,
                        quantidadeRefeicoes: refeicoesNoDia.length,
                        isHoje: i === 0,
                        isPast: false
                    });
                }

                const totalRefeicoes = semana.reduce((total, dia) => total + dia.quantidadeRefeicoes, 0);
                const diasPlanejados = semana.filter(d => d.temPlano).length;

                return {
                    semana: semana,
                    totalRefeicoes: totalRefeicoes,
                    diasPlanejados: diasPlanejados
                };
            }),
            catchError(error => {
                return of(this.gerarPlanejamentoSemanalVazio());
            })
        );
    }

    private gerarPlanejamentoSemanalVazio(): PlanejamentoSemanal {
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const semana: DiaSemanaPlanejamento[] = [];

        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);

            semana.push({
                diaSemana: diasSemana[data.getDay()],
                diaNumero: data.getDate(),
                data: data.toISOString().split('T')[0],
                temPlano: false,
                quantidadeRefeicoes: 0,
                isHoje: i === 0,
                isPast: i < 0
            });
        }

        return {
            semana: semana,
            totalRefeicoes: 0,
            diasPlanejados: 0
        };
    }

    registrarConsumoAgua(quantidade: number): Observable<any> {
        return this._apiService.post('/user/consumo-agua', { quantidade });
    }

    obterProximasRefeicoes(): Observable<RefeicaoResumo[]> {
        return this._apiService.get<RefeicaoResumo[]>('/refeicoes/proximas')
            .pipe(
                catchError(error => {
                    return of([]);
                })
            );
    }

    gerarRecomendacoesInteligentes(user: any, consumoDiario: ConsumoCaloricoResponse): any[] {
        const recomendacoes = [];
        const metaCalorica = user?.metaCalorica || 2000;
        const caloriasFaltantes = metaCalorica - consumoDiario.caloriasConsumidas;
        const horaAtual = new Date().getHours();

        // if (consumoDiario.agua < 2000) {
        //     recomendacoes.push({
        //         tipo: 'agua',
        //         titulo: 'Hidrate-se!',
        //         descricao: `Você bebeu apenas ${consumoDiario.agua}ml hoje. Meta: 2L`,
        //         icone: 'water-drop',
        //         cor: 'blue',
        //         acao: 'REGISTRAR_AGUA'
        //     });
        // }

        // if (caloriasFaltantes > 300 && horaAtual < 20) {
        //     recomendacoes.push({
        //         tipo: 'calorias',
        //         titulo: 'Atenção às calorias',
        //         descricao: `Faltam ${Math.round(caloriasFaltantes)} calorias para sua meta`,
        //         icone: 'restaurant',
        //         cor: 'orange',
        //         acao: 'ADICIONAR_REFEICAO'
        //     });
        // }

        // if (consumoDiario.refeicoes.length < 3 && horaAtual > 14) {
        //     recomendacoes.push({
        //         tipo: 'refeicoes',
        //         titulo: 'Poucas refeições hoje',
        //         descricao: 'Considere fazer pelo menos 3 refeições por dia',
        //         icone: 'schedule',
        //         cor: 'amber',
        //         acao: 'VER_SUGESTOES'
        //     });
        // }

        return recomendacoes;
    }

    private calcularGastoCaloricoTotal(user: any): number {
        if (!user || !user.peso || !user.altura || !user.idade) {
            return 2000;
        }

        let tmb: number;
        if (user.sexo === 'MASCULINO') {
            tmb = 88.362 + (13.397 * user.peso) + (4.799 * user.altura) - (5.677 * user.idade);
        } else {
            tmb = 447.593 + (9.247 * user.peso) + (3.098 * user.altura) - (4.330 * user.idade);
        }

        const fatoresAtividade: { [key: string]: number } = {
            'SEDENTARIO': 1.2,
            'LEVEMENTE_ATIVO': 1.375,
            'MODERADAMENTE_ATIVO': 1.55,
            'MUITO_ATIVO': 1.725,
            'EXTREMAMENTE_ATIVO': 1.9
        };

        const fatorAtividade = fatoresAtividade[user.nivelAtividade] || 1.2;
        return Math.round(tmb * fatorAtividade);
    }

    buscarRefeicoesPorPeriodo(dataInicio: string, dataFim: string): Observable<any[]> {
        return this._httpClient.get<any[]>(`https://ttfdietbackend.tigasolutions.com.br/api/refeicoes/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}`)
            .pipe(
                catchError(error => {
                    return of([]);
                })
            );
    }

    buscarRefeicoesSemanaAtual(): Observable<any[]> {
        const hoje = new Date();
        const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const fimSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 6);

        const dataInicio = inicioSemana.toISOString().split('T')[0];
        const dataFim = fimSemana.toISOString().split('T')[0];

        return this.buscarRefeicoesPorPeriodo(dataInicio, dataFim);
    }

    processarPlanejamentoSemanal(refeicoes: any[]): any {
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const planejamentoSemanal = {
            semana: [] as any[],
            totalRefeicoes: 0,
            diasPlanejados: 0
        };

        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);

            const refeicoesNoDia = refeicoes.filter(r => {
                const dataRefeicao = new Date(r.dataHoraRefeicao);
                return dataRefeicao.toDateString() === data.toDateString();
            });

            const diaInfo = {
                diaSemana: diasSemana[data.getDay()],
                diaNumero: data.getDate(),
                data: data.toISOString().split('T')[0],
                temPlano: refeicoesNoDia.length > 0,
                quantidadeRefeicoes: refeicoesNoDia.length,
                isHoje: i === 0,
                isPast: i < 0
            };

            planejamentoSemanal.semana.push(diaInfo);
        }

        planejamentoSemanal.totalRefeicoes = planejamentoSemanal.semana
            .reduce((total, dia) => total + dia.quantidadeRefeicoes, 0);

        planejamentoSemanal.diasPlanejados = planejamentoSemanal.semana
            .filter(dia => dia.temPlano).length;

        return planejamentoSemanal;
    }

    private gerarPlanejamentoExemplo(): any {
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const semanaExemplo = [];

        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);

            const quantidadeRefeicoes = Math.floor(Math.random() * 4) + 1;

            semanaExemplo.push({
                diaSemana: diasSemana[data.getDay()],
                diaNumero: data.getDate(),
                data: data.toISOString().split('T')[0],
                temPlano: quantidadeRefeicoes > 0,
                quantidadeRefeicoes: quantidadeRefeicoes,
                isHoje: i === 0,
                isPast: false
            });
        }

        return {
            semana: semanaExemplo,
            totalRefeicoes: semanaExemplo.reduce((total, dia) => total + dia.quantidadeRefeicoes, 0),
            diasPlanejados: semanaExemplo.filter(dia => dia.temPlano).length
        };
    }

    carregarEstatisticasSemanaisComDados(): Observable<EstatisticasSemanais> {
        return this.buscarRefeicoesSemanaAtual().pipe(
            map(refeicoes => {
                const refeicoesAceitas = refeicoes.filter(r => r.status === 'ACEITA');

                const diasUnicos = new Set(
                    refeicoesAceitas.map(r => {
                        const data = new Date(r.dataHoraRefeicao);
                        return data.toISOString().split('T')[0];
                    })
                );

                const totalRefeicoes = refeicoesAceitas.length;
                const diasComRegistro = diasUnicos.size;
                const mediaCaloriasDiarias = diasComRegistro > 0 ?
                    this.calcularMediaCaloriasRefeicoes(refeicoesAceitas) / diasComRegistro : 0;

                const sequenciaAtual = this.calcularSequenciaConsecutiva(refeicoesAceitas);

                const estatisticas: EstatisticasSemanais = {
                    diasComRegistro,
                    totalRefeicoes,
                    mediaCaloriasDiarias: Math.round(mediaCaloriasDiarias),
                    sequenciaAtual
                };

                this._estatisticasSemanais.next(estatisticas);
                return estatisticas;
            }),
            catchError(error => {
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

    private calcularMediaCaloriasRefeicoes(refeicoes: any[]): number {
        if (refeicoes.length === 0) return 0;

        const totalCalorias = refeicoes.reduce((total, refeicao) => {
            const calorias = refeicao.alimentos?.reduce((sum: number, alimento: any) =>
                sum + (alimento.calorias || 0), 0) || 0;
            return total + calorias;
        }, 0);

        return totalCalorias;
    }

    private calcularSequenciaConsecutiva(refeicoes: any[]): number {
        if (refeicoes.length === 0) return 0;

        const hoje = new Date();
        let sequencia = 0;
        let dataVerificacao = new Date(hoje);

        while (sequencia < 30) {
            const dataString = dataVerificacao.toISOString().split('T')[0];

            const temRefeicaoNoDia = refeicoes.some(r => {
                const dataRefeicao = new Date(r.dataHoraRefeicao);
                return dataRefeicao.toISOString().split('T')[0] === dataString;
            });

            if (temRefeicaoNoDia) {
                sequencia++;
                dataVerificacao.setDate(dataVerificacao.getDate() - 1);
            } else {
                if (dataVerificacao.toDateString() === hoje.toDateString()) {
                    dataVerificacao.setDate(dataVerificacao.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        return sequencia;
    }

    gerarInsightsPlanejamento(planejamento: any): any[] {
        const insights = [];
        const totalRefeicoes = planejamento.totalRefeicoes;
        const diasPlanejados = planejamento.diasPlanejados;

        if (diasPlanejados === 7) {
            insights.push({
                tipo: 'sucesso',
                titulo: 'Semana completa!',
                descricao: 'Você tem refeições planejadas para todos os dias da semana.',
                icone: 'check_circle'
            });
        } else if (diasPlanejados >= 5) {
            insights.push({
                tipo: 'bom',
                titulo: 'Bom planejamento',
                descricao: `${diasPlanejados} dias planejados. Considere completar os demais.`,
                icone: 'trending_up'
            });
        } else {
            insights.push({
                tipo: 'alerta',
                titulo: 'Planejamento incompleto',
                descricao: `Apenas ${diasPlanejados} dias planejados. Que tal planejar mais?`,
                icone: 'warning'
            });
        }

        return insights;
    }

    calcularInsightsReais(refeicoes: any[], user: any): Observable<any> {
        const insights = {
            historicoDiario: this.gerarHistoricoDiario(refeicoes, user),
            resumoSemanal: this.gerarInsightsSemana(refeicoes, user),
            tendencias: this.calcularTendencias(refeicoes, user),
            recomendacoes: this.gerarRecomendacoesPersonalizadas(refeicoes, user)
        };

        return of(insights);
    }

    private gerarHistoricoDiario(refeicoes: any[], user: any): any[] {
        const historico = [];
        const hoje = new Date();

        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() - i);
            const dataString = data.toISOString().split('T')[0];

            const refeicoesNoDia = refeicoes.filter(r => {
                const dataRefeicao = new Date(r.dataHoraRefeicao);
                return dataRefeicao.toISOString().split('T')[0] === dataString;
            });

            const caloriasConsumidas = refeicoesNoDia.reduce((total, r) => {
                return total + (r.alimentos?.reduce((sum: number, a: any) => sum + a.calorias, 0) || 0);
            }, 0);

            const metaCalorica = user?.metaCalorica || 2000;

            historico.push({
                data: dataString,
                dia: data.toLocaleDateString('pt-BR', { weekday: 'short' }),
                refeicoes: refeicoesNoDia.length,
                calorias: caloriasConsumidas,
                percentualMeta: (caloriasConsumidas / metaCalorica) * 100,
                observacao: this.gerarObservacaoDia(refeicoesNoDia, caloriasConsumidas, metaCalorica)
            });
        }

        return historico;
    }

    private gerarObservacaoDia(refeicoes: any[], calorias: number, meta: number): string {
        if (refeicoes.length === 0) return 'Nenhuma refeição registrada';

        const percentual = (calorias / meta) * 100;

        if (percentual < 70) return 'Abaixo da meta calórica';
        if (percentual > 120) return 'Acima da meta calórica';
        if (refeicoes.length >= 4) return 'Boa distribuição de refeições';

        return 'Dentro da meta';
    }

    private gerarInsightsSemana(refeicoes: any[], user: any): any[] {
        const insights = [];
        const totalRefeicoes = refeicoes.length;
        const diasUnicos = new Set(refeicoes.map(r => {
            const data = new Date(r.dataHoraRefeicao);
            return data.toISOString().split('T')[0];
        })).size;

        if (totalRefeicoes >= 21) {
            insights.push({
                tipo: 'sucesso',
                titulo: 'Excelente consistência!',
                descricao: `${totalRefeicoes} refeições registradas esta semana.`
            });
        } else if (totalRefeicoes >= 14) {
            insights.push({
                tipo: 'bom',
                titulo: 'Boa frequência',
                descricao: `${totalRefeicoes} refeições registradas. Continue assim!`
            });
        } else {
            insights.push({
                tipo: 'atencao',
                titulo: 'Pode melhorar',
                descricao: `Apenas ${totalRefeicoes} refeições esta semana. Que tal aumentar?`
            });
        }

        insights.push({
            tipo: 'info',
            titulo: 'Dias ativos',
            descricao: `Você registrou refeições em ${diasUnicos} dias esta semana.`
        });

        return insights;
    }

    private calcularTendencias(refeicoes: any[], user: any): any {
        const agora = new Date();
        const umaSemanaAtras = new Date(agora.getTime() - (7 * 24 * 60 * 60 * 1000));

        const refeicoesRecentes = refeicoes.filter(r => {
            const dataRefeicao = new Date(r.dataHoraRefeicao);
            return dataRefeicao >= umaSemanaAtras;
        });

        const mediaRefeicoesDia = refeicoesRecentes.length / 7;
        const progressoMeta = this.calcularProgressoMeta(refeicoesRecentes, user);

        return {
            mediaRefeicoesDia: Math.round(mediaRefeicoesDia * 10) / 10,
            tendenciaCalorias: progressoMeta > 90 ? 'estavel' : progressoMeta > 70 ? 'crescente' : 'abaixo',
            progressoMeta: Math.round(progressoMeta)
        };
    }

    private gerarRecomendacoesPersonalizadas(refeicoes: any[], user: any): any[] {
        const recomendacoes = [];
        const horaAtual = new Date().getHours();

        if (refeicoes.length < 3 && horaAtual < 18) {
            recomendacoes.push({
                titulo: 'Adicione mais refeições',
                descricao: 'Distribua melhor suas refeições ao longo do dia',
                prioridade: 'alta'
            });
        }

        const ultimaRefeicao = refeicoes.sort((a, b) =>
            new Date(b.dataHoraRefeicao).getTime() - new Date(a.dataHoraRefeicao).getTime()
        )[0];

        if (ultimaRefeicao) {
            const horasDesdeUltima = (Date.now() - new Date(ultimaRefeicao.dataHoraRefeicao).getTime()) / (1000 * 60 * 60);

            if (horasDesdeUltima > 6 && horaAtual < 22) {
                recomendacoes.push({
                    titulo: 'Que tal uma refeição?',
                    descricao: `Sua última refeição foi há ${Math.round(horasDesdeUltima)} horas`,
                    prioridade: 'media'
                });
            }
        }

        return recomendacoes;
    }

    private calcularProgressoMeta(refeicoes: any[], user: any): number {
        const metaCalorica = user?.metaCalorica || 2000;
        const totalCalorias = refeicoes.reduce((total, r) => {
            return total + (r.alimentos?.reduce((sum: number, a: any) => sum + a.calorias, 0) || 0);
        }, 0);

        const diasPeriodo = 7;
        const metaTotal = metaCalorica * diasPeriodo;

        return (totalCalorias / metaTotal) * 100;
    }
}
