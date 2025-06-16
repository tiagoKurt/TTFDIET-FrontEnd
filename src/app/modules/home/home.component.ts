import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Subject, takeUntil, combineLatest, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from 'app/core/services/api.service';
import { HomeDashboardService, ConsumoCaloricoResponse, EstatisticasSemanais } from './home-dashboard.service';
import { MetasService } from '../metas/metas.service';
import { Meta } from '../metas/metas.component';
import { RefeicoesService } from '../refeicoes/refeicoes.service';
import { HistoricoInsightsModalComponent } from './historico-insights-modal.component';

interface MetricasSaude {
    imc: number;
    classificacaoImc: string;
    gastoCaloricoTotal: number;
    gastoCaloricoBasal: number;
}

interface DashboardStats {
    caloriasConsumidas: number;
    caloriasMeta: number;
    porcentagemCalorias: number;
    aguaConsumida: number;
    aguaMeta: number;
    porcentagemAgua: number;
}

interface RecomendacaoPersonalizada {
    tipo: 'nutricional' | 'atividade' | 'hidratacao' | 'sono';
    prioridade: 'alta' | 'media' | 'baixa';
    titulo: string;
    descricao: string;
    icone: string;
    corIcone: string;
    acao?: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatProgressBarModule,
        MatDividerModule,
        MatTooltipModule,
        MatChipsModule,
    ],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    user: User;
    metricas: MetricasSaude;
    dashboard: DashboardStats;
    recomendacoes: RecomendacaoPersonalizada[] = [];
    estatisticas: EstatisticasSemanais;
    metas: Meta[] = [];
    metasResumo = {
        total: 0,
        completas: 0,
        emAndamento: 0
    };
    planejamentoSemanal: any;
    insightsPlanejamento: any[] = [];
    dadosInsights: any = null; // Para armazenar dados do modal

    perfilCompleto: boolean = false;
    proximaEtapa: string = '';

    diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    constructor(
        private router: Router,
        private _userService: UserService,
        private dialog: MatDialog,
        private http: HttpClient,
        private apiService: ApiService,
        private _dashboardService: HomeDashboardService,
        private _metasService: MetasService,
        private _refeicoesService: RefeicoesService
    ) {}

    ngOnInit(): void {
        this.carregarDadosUsuario();
        this.inicializarDashboard();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private carregarDadosUsuario(): void {
        this._userService.getProfile()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (user) => {
                    this.user = user;
                    this.avaliarStatusPerfil();
                    this.calcularMetricas();
                    this.carregarDadosDashboard();
                    this.carregarPlanejamentoSemanal();
                    this.carregarInsightsReais();
                },
                error: (error) => {
                    console.error('Erro ao carregar dados do usuário:', error);
                }
            });
    }

    private avaliarStatusPerfil(): void {
        const camposObrigatorios = ['altura', 'peso', 'idade', 'sexo', 'nivelAtividade', 'objetivoDieta'];
        const camposFaltantes = camposObrigatorios.filter(campo => !this.user[campo]);

        this.perfilCompleto = camposFaltantes.length === 0;

        if (!this.perfilCompleto) {
            this.proximaEtapa = this.obterProximaEtapa(camposFaltantes);
        }
    }

    private obterProximaEtapa(camposFaltantes: string[]): string {
        const etapas = {
            'altura': 'Complete suas medidas corporais',
            'peso': 'Registre seu peso atual',
            'idade': 'Informe sua idade',
            'sexo': 'Defina seu perfil biológico',
            'nivelAtividade': 'Escolha seu nível de atividade',
            'objetivoDieta': 'Defina seu objetivo nutricional'
        };

        return etapas[camposFaltantes[0]] || 'Complete seu perfil';
    }

    private calcularMetricas(): void {
        if (!this.user.altura || !this.user.peso || !this.user.idade) {
            return;
        }

        const alturaM = this.user.altura / 100;
        const imc = this.user.peso / (alturaM * alturaM);

        this.metricas = {
            imc: Math.round(imc * 10) / 10,
            classificacaoImc: this.classificarIMC(imc),
            gastoCaloricoBasal: this.calcularGastoBasal(),
            gastoCaloricoTotal: this.calcularGastoTotal()
        };
    }

    private classificarIMC(imc: number): string {
        if (imc < 18.5) return 'Abaixo do peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        return 'Obesidade';
    }

    private calcularGastoBasal(): number {
        if (!this.user.peso || !this.user.altura || !this.user.idade || !this.user.sexo) {
            return 0;
        }

        if (this.user.sexo === 'MASCULINO') {
            return Math.round(88.362 + (13.397 * this.user.peso) + (4.799 * this.user.altura) - (5.677 * this.user.idade));
        } else {
            return Math.round(447.593 + (9.247 * this.user.peso) + (3.098 * this.user.altura) - (4.330 * this.user.idade));
        }
    }

    private calcularGastoTotal(): number {
        const gastoBasal = this.calcularGastoBasal();
        const fatores = {
            'SEDENTARIO': 1.2,
            'LEVE': 1.375,
            'MODERADO': 1.55,
            'INTENSO': 1.725,
            'ATLETA': 1.9
        };

        const fator = fatores[this.user.nivelAtividade] || 1.2;
        return Math.round(gastoBasal * fator);
    }

    private inicializarDashboard(): void {
        this.dashboard = {
            caloriasConsumidas: 0,
            caloriasMeta: this.metricas?.gastoCaloricoTotal || 2000,
            porcentagemCalorias: 0,
            aguaConsumida: 0,
            aguaMeta: Math.round((this.user?.peso || 70) * 35),
            porcentagemAgua: 0
        };
    }

    private carregarDadosDashboard(): void {
        combineLatest([
            this._dashboardService.carregarConsumoDiario(),
            this._dashboardService.carregarEstatisticasSemanaisComDados(),
            this._metasService.listarMetas(),
            this._dashboardService.obterPlanejamentoSemanal()
        ]).pipe(takeUntil(this._unsubscribeAll))
        .subscribe({
            next: ([consumo, estatisticas, metas, planejamento]) => {
                this.atualizarDashboard(consumo);
                this.estatisticas = estatisticas;
                this.metas = metas;
                this.planejamentoSemanal = planejamento;
                this.atualizarResumoMetas();
                this.gerarRecomendacoesPersonalizadas(consumo);
                this.insightsPlanejamento = this._dashboardService.gerarInsightsPlanejamento(planejamento);
            }
        });
    }

    private atualizarDashboard(consumo: ConsumoCaloricoResponse): void {
        const caloriasMeta = this.metricas?.gastoCaloricoTotal || 2000;
        const aguaMeta = Math.round((this.user?.peso || 70) * 35);

        this.dashboard = {
            caloriasConsumidas: consumo.caloriasConsumidas,
            caloriasMeta: caloriasMeta,
            porcentagemCalorias: (consumo.caloriasConsumidas / caloriasMeta) * 100,
            aguaConsumida: consumo.agua,
            aguaMeta: aguaMeta,
            porcentagemAgua: (consumo.agua / aguaMeta) * 100
        };
    }

    private gerarRecomendacoesPersonalizadas(consumo?: ConsumoCaloricoResponse): void {
        if (!this.user || !consumo) {
            this.recomendacoes = this.obterRecomendacoesBasicas();
            return;
        }

        const recomendacoesIA = this._dashboardService.gerarRecomendacoesInteligentes(this.user, consumo);
        const recomendacoesBasicas = this.obterRecomendacoesBasicas();

        this.recomendacoes = [...recomendacoesIA, ...recomendacoesBasicas].slice(0, 6);
    }

    private obterRecomendacoesBasicas(): RecomendacaoPersonalizada[] {
        const recomendacoes: RecomendacaoPersonalizada[] = [];

        if (this.metricas?.imc) {
            if (this.metricas.imc < 18.5) {
                recomendacoes.push({
                    tipo: 'nutricional',
                    prioridade: 'alta',
                    titulo: 'Foque no ganho de peso saudável',
                    descricao: 'Seu IMC indica que você está abaixo do peso. Considere aumentar a ingestão calórica.',
                    icone: 'trending_up',
                    corIcone: 'text-blue-500'
                });
            } else if (this.metricas.imc > 25) {
                recomendacoes.push({
                    tipo: 'nutricional',
                    prioridade: 'alta',
                    titulo: 'Controle seu consumo calórico',
                    descricao: 'Seu IMC indica sobrepeso. Um déficit calórico pode ajudar.',
                    icone: 'trending_down',
                    corIcone: 'text-orange-500'
                });
            }
        }

        recomendacoes.push({
            tipo: 'hidratacao',
            prioridade: 'media',
            titulo: 'Mantenha-se hidratado',
            descricao: `Para seu peso, recomendamos ${Math.round((this.user?.peso || 70) * 35)} ml de água por dia.`,
            icone: 'water_drop',
            corIcone: 'text-blue-400'
        });

        return recomendacoes;
    }

    completarPerfil(): void {
        this.router.navigate(['/perfil']);
    }

    registrarRefeicao(): void {
        this.router.navigate(['/refeicoes/nova']);
    }

    registrarAgua(): void {
        console.log('Registrar água');
        // this._dashboardService.registrarConsumoAgua(250).subscribe();
    }

    verPlanejamento(): void {
        this.router.navigate(['/planejamento']);
    }

    verMetas(): void {
        this.router.navigate(['/metas']);
    }

    verHistorico(): void {
        if (this.dadosInsights) {
            this.dialog.open(HistoricoInsightsModalComponent, {
                width: '800px',
                maxWidth: '90vw',
                data: this.dadosInsights
            });
        } else {
            this.dialog.open(HistoricoInsightsModalComponent, {
                width: '800px',
                maxWidth: '90vw',
                data: {
                    resumoSemanal: {
                        sequenciaAtual: this.estatisticas?.sequenciaAtual || 0,
                        totalRefeicoes: this.estatisticas?.totalRefeicoes || 0,
                        mediaCaloriasDiarias: this.estatisticas?.mediaCaloriasDiarias || 0,
                        progressoMeta: 0
                    },
                    historicoDiario: [],
                    insightsSemana: [],
                    tendencias: {
                        consistenciaRefeicoes: 0,
                        metaHidratacao: 0,
                        equilibrioCalorico: 0
                    },
                    recomendacoes: []
                }
            });
        }
    }

    obterCorProgressoIMC(): string {
        if (!this.metricas?.imc) return 'primary';

        if (this.metricas.imc < 18.5 || this.metricas.imc > 30) return 'warn';
        if (this.metricas.imc > 25) return 'accent';
        return 'primary';
    }

    obterMensagemBemVindo(): string {
        const hora = new Date().getHours();
        let saudacao = '';

        if (hora < 12) {
            saudacao = 'Bom dia';
        } else if (hora < 18) {
            saudacao = 'Boa tarde';
        } else {
            saudacao = 'Boa noite';
        }

        return `${saudacao}, ${this.user?.nome || 'usuário'}!`;
    }

    obterLabelNivelAtividade(): string {
        const labels = {
            'SEDENTARIO': 'Sedentário',
            'LEVE': 'Leve',
            'MODERADO': 'Moderado',
            'INTENSO': 'Intenso',
            'ATLETA': 'Atleta'
        };
        return labels[this.user?.nivelAtividade] || 'Não informado';
    }

    obterIconeObjetivo(): string {
        const icones = {
            'PERDER_PESO': 'trending_down',
            'GANHAR_MASSA': 'trending_up',
            'MANTER_PESO': 'balance'
        };
        return icones[this.user?.objetivoDieta] || 'flag';
    }

    obterLabelObjetivo(): string {
        const labels = {
            'PERDER_PESO': 'Perder Peso',
            'GANHAR_MASSA': 'Ganhar Massa Muscular',
            'MANTER_PESO': 'Manter Peso Atual'
        };
        return labels[this.user?.objetivoDieta] || 'Definir Objetivo';
    }

    obterDescricaoObjetivo(): string {
        const descricoes = {
            'PERDER_PESO': 'Reduzindo calorias e aumentando atividade física',
            'GANHAR_MASSA': 'Focando em proteínas e treino de força',
            'MANTER_PESO': 'Mantendo equilíbrio calórico e hábitos saudáveis'
        };
        return descricoes[this.user?.objetivoDieta] || 'Configure seu perfil para personalizar sua experiência';
    }

    obterDiasComPlanejamento(): number {
        return this.planejamentoSemanal?.totalDiasComPlano || 0;
    }

    obterTotalRefeicoesSemana(): number {
        return this.planejamentoSemanal?.totalRefeicoes || 0;
    }

    obterPorcentagemPlanejamento(): number {
        return this.planejamentoSemanal?.porcentagemPlanejamento || 0;
    }

    trackByRecomendacao(index: number, item: RecomendacaoPersonalizada): string {
        return item.titulo + item.tipo;
    }

    obterClassePrioridade(prioridade: string): string {
        const classes = {
            'alta': 'border-red-200 bg-red-50',
            'media': 'border-yellow-200 bg-yellow-50',
            'baixa': 'border-green-200 bg-green-50'
        };
        return classes[prioridade] || 'border-gray-200 bg-gray-50';
    }

    private atualizarResumoMetas(): void {
        this.metasResumo.total = this.metas.length;
        this.metasResumo.completas = this.metas.filter(m => m.completa).length;
        this.metasResumo.emAndamento = this.metas.filter(m => !m.completa).length;
    }

    obterMetaPorTipo(tipo: string): Meta | null {
        return this.metas.find(m => m.tipoMeta === tipo) || null;
    }

    calcularProgressoMeta(meta: Meta): number {
        if (!meta || !meta.valorMeta || meta.valorMeta === 0) return 0;
        return Math.min(100, (meta.valorAtual / meta.valorMeta) * 100);
    }

    obterIconeMetaPorTipo(tipo: string): string {
        const icones = {
            'PESO': 'scale',
            'AGUA': 'water_drop',
            'CALORIAS': 'local_fire_department'
        };
        return icones[tipo] || 'flag';
    }

    obterCorMetaPorTipo(tipo: string): string {
        const cores = {
            'PESO': 'text-blue-500',
            'AGUA': 'text-cyan-500',
            'CALORIAS': 'text-orange-500'
        };
        return cores[tipo] || 'text-gray-500';
    }

    obterUnidadeMetaPorTipo(tipo: string): string {
        const unidades = {
            'PESO': 'kg',
            'AGUA': 'ml',
            'CALORIAS': 'kcal'
        };
        return unidades[tipo] || '';
    }

    private carregarPlanejamentoSemanal(): void {
        this._dashboardService.buscarRefeicoesSemanaAtual()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (refeicoes) => {
                    this.planejamentoSemanal = this._dashboardService.processarPlanejamentoSemanal(refeicoes);
                    this.insightsPlanejamento = this.planejamentoSemanal.insights || [];
                },
                error: (error) => {
                    console.error('Erro ao carregar planejamento semanal:', error);
                    this.planejamentoSemanal = this.gerarPlanejamentoExemplo();
                }
            });
    }

    private carregarInsightsReais(): void {
        if (!this.user) return;

        this._dashboardService.buscarRefeicoesSemanaAtual()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (refeicoes) => {
                    this._dashboardService.calcularInsightsReais(refeicoes, this.user)
                        .subscribe(insights => {
                            this.dadosInsights = insights;
                            this.estatisticas = {
                                diasComRegistro: insights.resumoSemanal.sequenciaAtual,
                                totalRefeicoes: insights.resumoSemanal.totalRefeicoes,
                                mediaCaloriasDiarias: insights.resumoSemanal.mediaCaloriasDiarias,
                                sequenciaAtual: insights.resumoSemanal.sequenciaAtual
                            };
                        });
                },
                error: (error) => {
                    console.error('Erro ao carregar insights:', error);
                }
            });
    }

    private gerarPlanejamentoExemplo(): any {
        const hoje = new Date();
        const semana = [];

        for (let i = 0; i < 7; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + i);

            semana.push({
                data: data.toISOString().split('T')[0],
                diaSemana: this.diasSemana[data.getDay()],
                diaNumero: data.getDate(),
                isHoje: i === 0,
                isPast: false,
                temPlano: Math.random() > 0.4,
                quantidadeRefeicoes: Math.floor(Math.random() * 4) + 1,
                totalCalorias: Math.floor(Math.random() * 1000) + 1500
            });
        }

        const totalDiasComPlano = semana.filter(d => d.temPlano).length;
        const totalRefeicoes = semana.reduce((total, d) => total + d.quantidadeRefeicoes, 0);

        return {
            semana,
            totalDiasComPlano,
            totalRefeicoes,
            porcentagemPlanejamento: (totalDiasComPlano / 7) * 100,
            insights: []
        };
    }

    formatarDiaComData(data: string, diaSemana: string, diaNumero: number): string {
        return `${diaSemana} - ${diaNumero}`;
    }
}
