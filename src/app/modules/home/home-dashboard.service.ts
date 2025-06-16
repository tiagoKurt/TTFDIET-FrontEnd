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
        return this._apiService.get<any[]>('/api/refeicoes/semana-atual')
            .pipe(
                map(refeicoes => this.processarPlanejamentoSemanal(refeicoes)),
                catchError(error => {
                    console.log('Planejamento semanal não disponível, gerando exemplo');
                    return of(this.gerarPlanejamentoExemplo());
                })
            );
    }

    buscarRefeicoesPorPeriodo(dataInicio: string, dataFim: string): Observable<any[]> {
        return this._httpClient.get<any[]>('/api/refeicoes/por-periodo', {
            params: {
                dataInicio,
                dataFim
            }
        }).pipe(
            catchError(error => {
                console.log('Erro ao buscar refeições por período:', error);
                return of([]);
            })
        );
    }

    buscarRefeicoesSemanaAtual(): Observable<any[]> {
        return this._httpClient.get<any[]>('/api/refeicoes/semana-atual-real')
            .pipe(
                catchError(error => {
                    console.log('Erro ao buscar refeições da semana atual:', error);
                    return of([]);
                })
            );
    }

    processarPlanejamentoSemanal(refeicoes: any[]): any {
        const hoje = new Date();
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const semana = [];
        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);

            const dataStr = data.toISOString().split('T')[0];
            const refeicoesDia = refeicoes.filter(r =>
                r.dataHora && r.dataHora.startsWith(dataStr)
            );

            semana.push({
                data: dataStr,
                diaSemana: diasSemana[data.getDay()],
                diaNumero: data.getDate(),
                isHoje: i === 0,
                isPast: false,
                temPlano: refeicoesDia.length > 0,
                quantidadeRefeicoes: refeicoesDia.length,
                refeicoes: refeicoesDia,
                totalCalorias: refeicoesDia.reduce((total, r) => total + (r.totalCalorias || 0), 0)
            });
        }

        const totalDiasComPlano = semana.filter(d => d.temPlano).length;
        const totalRefeicoes = semana.reduce((total, d) => total + d.quantidadeRefeicoes, 0);

        return {
            semana,
            totalDiasComPlano,
            totalRefeicoes,
            porcentagemPlanejamento: (totalDiasComPlano / 7) * 100,
            insights: this.gerarInsightsPlanejamento({ semana, totalDiasComPlano, totalRefeicoes })
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

    calcularInsightsReais(refeicoes: any[], user: any): Observable<any> {
        const hoje = new Date();
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);

        const refeicoesSemana = refeicoes.filter(r => {
            const dataRefeicao = new Date(r.dataHora);
            return dataRefeicao >= seteDiasAtras && dataRefeicao <= hoje;
        });

        const diasComRefeicao = new Set(
            refeicoesSemana.map(r => r.dataHora.split('T')[0])
        ).size;

        const totalCalorias = refeicoesSemana.reduce((total, r) => total + (r.totalCalorias || 0), 0);
        const mediaCaloriasDiarias = diasComRefeicao > 0 ? Math.round(totalCalorias / diasComRefeicao) : 0;

        const sequenciaAtual = this.calcularSequenciaConsecutiva(refeicoesSemana);

        const historicoDiario = this.gerarHistoricoDiario(refeicoesSemana, user);

        const insightsSemana = this.gerarInsightsSemana(refeicoesSemana, user);

        const tendencias = this.calcularTendencias(refeicoesSemana, user);

        const recomendacoes = this.gerarRecomendacoesPersonalizadas(refeicoesSemana, user);

        return of({
            resumoSemanal: {
                sequenciaAtual,
                totalRefeicoes: refeicoesSemana.length,
                mediaCaloriasDiarias,
                progressoMeta: this.calcularProgressoMeta(refeicoesSemana, user)
            },
            historicoDiario,
            insightsSemana,
            tendencias,
            recomendacoes
        });
    }

    private gerarHistoricoDiario(refeicoes: any[], user: any): any[] {
        const historico = [];
        const hoje = new Date();

        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() - i);
            const dataStr = data.toISOString().split('T')[0];

            const refeicoesDia = refeicoes.filter(r =>
                r.dataHora && r.dataHora.startsWith(dataStr)
            );

            const caloriasConsumidas = refeicoesDia.reduce((total, r) => total + (r.totalCalorias || 0), 0);
            const caloriasMeta = this.calcularGastoCaloricoTotal(user);
            const aguaMeta = (user.peso || 70) * 35;

            historico.push({
                data: dataStr,
                refeicoesDia: refeicoesDia.length,
                caloriasConsumidas,
                caloriasMeta,
                aguaConsumida: 0,
                aguaMeta,
                pesoAtual: user.peso,
                observacoes: this.gerarObservacaoDia(refeicoesDia, caloriasConsumidas, caloriasMeta)
            });
        }

        return historico;
    }

    private gerarObservacaoDia(refeicoes: any[], calorias: number, meta: number): string {
        if (refeicoes.length === 0) {
            return 'Nenhuma refeição registrada';
        }

        const percentual = (calorias / meta) * 100;

        if (percentual < 70) {
            return 'Consumo calórico abaixo do recomendado';
        } else if (percentual > 110) {
            return 'Consumo calórico acima da meta';
        } else {
            return 'Dia equilibrado nutricionalmente';
        }
    }

    private gerarInsightsSemana(refeicoes: any[], user: any): any[] {
        const insights = [];
        const diasComRefeicao = new Set(refeicoes.map(r => r.dataHora.split('T')[0])).size;

        if (diasComRefeicao >= 6) {
            insights.push({
                tipo: 'sucesso',
                icone: 'check_circle',
                titulo: 'Excelente consistência!',
                descricao: `Você registrou refeições em ${diasComRefeicao} dos últimos 7 dias.`
            });
        } else if (diasComRefeicao >= 4) {
            insights.push({
                tipo: 'atencao',
                icone: 'trending_up',
                titulo: 'Boa consistência',
                descricao: `${diasComRefeicao} dias com registros. Tente manter a regularidade.`
            });
        } else {
            insights.push({
                tipo: 'alerta',
                icone: 'warning',
                titulo: 'Melhore a consistência',
                descricao: `Apenas ${diasComRefeicao} dias com registros. Registre suas refeições diariamente.`
            });
        }

        const tiposRefeicao = new Set(refeicoes.map(r => r.tipoRefeicao)).size;
        if (tiposRefeicao >= 4) {
            insights.push({
                tipo: 'sucesso',
                icone: 'restaurant_menu',
                titulo: 'Boa variedade alimentar',
                descricao: `${tiposRefeicao} tipos diferentes de refeições registradas.`
            });
        }

        return insights;
    }

    private calcularTendencias(refeicoes: any[], user: any): any {
        const diasComRefeicao = new Set(refeicoes.map(r => r.dataHora.split('T')[0])).size;
        const consistenciaRefeicoes = Math.round((diasComRefeicao / 7) * 100);

        const totalCalorias = refeicoes.reduce((total, r) => total + (r.totalCalorias || 0), 0);
        const metaCalorias = this.calcularGastoCaloricoTotal(user) * 7;
        const equilibrioCalorico = Math.min(100, Math.round((totalCalorias / metaCalorias) * 100));

        return {
            consistenciaRefeicoes,
            metaHidratacao: 65,
            equilibrioCalorico
        };
    }

    private gerarRecomendacoesPersonalizadas(refeicoes: any[], user: any): any[] {
        const recomendacoes = [];
        const diasComRefeicao = new Set(refeicoes.map(r => r.dataHora.split('T')[0])).size;

        if (diasComRefeicao < 5) {
            recomendacoes.push({
                prioridade: 'alta',
                icone: 'schedule',
                corIcone: 'text-red-600',
                titulo: 'Estabeleça uma rotina',
                descricao: 'Registre suas refeições diariamente para melhor controle nutricional.'
            });
        }

        const totalCalorias = refeicoes.reduce((total, r) => total + (r.totalCalorias || 0), 0);
        const metaSemanal = this.calcularGastoCaloricoTotal(user) * 7;

        if (totalCalorias < metaSemanal * 0.8) {
            recomendacoes.push({
                prioridade: 'media',
                icone: 'restaurant',
                corIcone: 'text-orange-600',
                titulo: 'Aumente o consumo calórico',
                descricao: 'Suas calorias estão abaixo do recomendado para seus objetivos.'
            });
        }

        return recomendacoes;
    }

    private calcularProgressoMeta(refeicoes: any[], user: any): number {
        const totalCalorias = refeicoes.reduce((total, r) => total + (r.totalCalorias || 0), 0);
        const metaSemanal = this.calcularGastoCaloricoTotal(user) * 7;
        return Math.min(100, Math.round((totalCalorias / metaSemanal) * 100));
    }
}
