import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

export interface HistoricoInsight {
    data: string;
    sequenciaAtual: number;
    refeicoesDia: number;
    caloriasConsumidas: number;
    caloriasMeta: number;
    aguaConsumida: number;
    aguaMeta: number;
    pesoAtual?: number;
    observacoes?: string;
}

@Component({
    selector: 'app-historico-insights-modal',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatProgressBarModule,
        MatChipsModule
    ],
    template: `
        <div class="historico-insights-modal">
            <div mat-dialog-title class="flex items-center justify-between">
                <div class="flex items-center">
                    <mat-icon class="text-purple-600 mr-2">insights</mat-icon>
                    <span>Histórico de Insights</span>
                </div>
                <button mat-icon-button (click)="fechar()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div mat-dialog-content class="max-h-96 overflow-y-auto">
                <mat-tab-group>
                    <!-- Aba Resumo Semanal -->
                    <mat-tab label="Esta Semana">
                        <div class="p-4">
                            <div class="grid grid-cols-2 gap-4 mb-6">
                                <!-- Sequência Atual -->
                                <div class="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <mat-icon class="text-orange-600 mr-2">local_fire_department</mat-icon>
                                        <span class="font-semibold text-gray-800">Sequência</span>
                                    </div>
                                    <div class="text-2xl font-bold text-orange-600">{{ resumoSemanal.sequenciaAtual }}</div>
                                    <div class="text-sm text-gray-600">dias consecutivos</div>
                                </div>

                                <!-- Total de Refeições -->
                                <div class="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <mat-icon class="text-green-600 mr-2">restaurant</mat-icon>
                                        <span class="font-semibold text-gray-800">Refeições</span>
                                    </div>
                                    <div class="text-2xl font-bold text-green-600">{{ resumoSemanal.totalRefeicoes }}</div>
                                    <div class="text-sm text-gray-600">esta semana</div>
                                </div>

                                <!-- Média de Calorias -->
                                <div class="bg-gradient-to-r from-blue-100 to-cyan-100 p-4 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <mat-icon class="text-blue-600 mr-2">local_fire_department</mat-icon>
                                        <span class="font-semibold text-gray-800">Média Diária</span>
                                    </div>
                                    <div class="text-2xl font-bold text-blue-600">{{ resumoSemanal.mediaCaloriasDiarias }}</div>
                                    <div class="text-sm text-gray-600">kcal/dia</div>
                                </div>

                                <!-- Progresso da Meta -->
                                <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <mat-icon class="text-purple-600 mr-2">trending_up</mat-icon>
                                        <span class="font-semibold text-gray-800">Meta Semanal</span>
                                    </div>
                                    <div class="text-2xl font-bold text-purple-600">{{ resumoSemanal.progressoMeta }}%</div>
                                    <div class="text-sm text-gray-600">atingido</div>
                                </div>
                            </div>

                            <!-- Insights da Semana -->
                            <div class="mb-4">
                                <h4 class="font-semibold text-gray-800 mb-3">Insights da Semana</h4>
                                <div class="space-y-2">
                                    <div *ngFor="let insight of insightsSemana"
                                         class="p-3 rounded-lg border-l-4"
                                         [class]="obterClasseInsight(insight.tipo)">
                                        <div class="flex items-start">
                                            <mat-icon [class]="obterCorIconeInsight(insight.tipo) + ' mr-2 mt-0.5'">
                                                {{ insight.icone }}
                                            </mat-icon>
                                            <div>
                                                <div class="font-medium">{{ insight.titulo }}</div>
                                                <div class="text-sm mt-1">{{ insight.descricao }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </mat-tab>

                    <!-- Aba Histórico Diário -->
                    <mat-tab label="Últimos 7 Dias">
                        <div class="p-4">
                            <div class="space-y-4">
                                <div *ngFor="let dia of historicoDiario"
                                     class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="font-semibold text-gray-800">{{ formatarData(dia.data) }}</div>
                                        <mat-chip-set>
                                            <mat-chip [class]="dia.refeicoesDia >= 3 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
                                                {{ dia.refeicoesDia }} refeições
                                            </mat-chip>
                                        </mat-chip-set>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <!-- Calorias -->
                                        <div>
                                            <div class="text-gray-600 mb-1">Calorias</div>
                                            <div class="flex items-center">
                                                <span class="font-medium">{{ dia.caloriasConsumidas }}</span>
                                                <span class="text-gray-500 mx-1">/</span>
                                                <span class="text-gray-500">{{ dia.caloriasMeta }}</span>
                                            </div>
                                            <mat-progress-bar
                                                [value]="(dia.caloriasConsumidas / dia.caloriasMeta) * 100"
                                                class="mt-1">
                                            </mat-progress-bar>
                                        </div>

                                        <!-- Água -->
                                        <div>
                                            <div class="text-gray-600 mb-1">Hidratação</div>
                                            <div class="flex items-center">
                                                <span class="font-medium">{{ dia.aguaConsumida }}ml</span>
                                                <span class="text-gray-500 mx-1">/</span>
                                                <span class="text-gray-500">{{ dia.aguaMeta }}ml</span>
                                            </div>
                                            <mat-progress-bar
                                                [value]="(dia.aguaConsumida / dia.aguaMeta) * 100"
                                                color="accent"
                                                class="mt-1">
                                            </mat-progress-bar>
                                        </div>
                                    </div>

                                    <div *ngIf="dia.observacoes" class="mt-3 text-sm text-gray-600 italic">
                                        "{{ dia.observacoes }}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </mat-tab>

                    <!-- Aba Tendências -->
                    <mat-tab label="Tendências">
                        <div class="p-4">
                            <div class="space-y-6">
                                <!-- Gráfico de Progresso (simulado) -->
                                <div>
                                    <h4 class="font-semibold text-gray-800 mb-3">Progresso das Metas</h4>
                                    <div class="space-y-3">
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span class="text-sm font-medium">Consistência nas Refeições</span>
                                            <div class="flex items-center">
                                                <mat-progress-bar
                                                    [value]="tendencias.consistenciaRefeicoes"
                                                    class="w-20 mr-2">
                                                </mat-progress-bar>
                                                <span class="text-sm font-bold">{{ tendencias.consistenciaRefeicoes }}%</span>
                                            </div>
                                        </div>

                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span class="text-sm font-medium">Meta de Hidratação</span>
                                            <div class="flex items-center">
                                                <mat-progress-bar
                                                    [value]="tendencias.metaHidratacao"
                                                    color="accent"
                                                    class="w-20 mr-2">
                                                </mat-progress-bar>
                                                <span class="text-sm font-bold">{{ tendencias.metaHidratacao }}%</span>
                                            </div>
                                        </div>

                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span class="text-sm font-medium">Equilíbrio Calórico</span>
                                            <div class="flex items-center">
                                                <mat-progress-bar
                                                    [value]="tendencias.equilibrioCalorico"
                                                    color="warn"
                                                    class="w-20 mr-2">
                                                </mat-progress-bar>
                                                <span class="text-sm font-bold">{{ tendencias.equilibrioCalorico }}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Recomendações -->
                                <div>
                                    <h4 class="font-semibold text-gray-800 mb-3">Recomendações Personalizadas</h4>
                                    <div class="space-y-2">
                                        <div *ngFor="let recomendacao of recomendacoes"
                                             class="p-3 rounded-lg border-l-4"
                                             [class]="obterClasseRecomendacao(recomendacao.prioridade)">
                                            <div class="flex items-start">
                                                <mat-icon [class]="recomendacao.corIcone + ' mr-2 mt-0.5'">
                                                    {{ recomendacao.icone }}
                                                </mat-icon>
                                                <div>
                                                    <div class="font-medium">{{ recomendacao.titulo }}</div>
                                                    <div class="text-sm mt-1">{{ recomendacao.descricao }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </mat-tab>
                </mat-tab-group>
            </div>

            <div mat-dialog-actions class="flex justify-end">
                <button mat-button (click)="fechar()">Fechar</button>
                <button mat-flat-button color="primary" (click)="exportarDados()">
                    <mat-icon class="mr-1">download</mat-icon>
                    Exportar
                </button>
            </div>
        </div>
    `,
    styles: [`
        .historico-insights-modal {
            width: 600px;
            max-width: 90vw;
        }

        ::ng-deep .mat-mdc-dialog-content {
            padding: 0 !important;
        }
    `]
})
export class HistoricoInsightsModalComponent implements OnInit {
    resumoSemanal = {
        sequenciaAtual: 0,
        totalRefeicoes: 0,
        mediaCaloriasDiarias: 0,
        progressoMeta: 0
    };

    insightsSemana: any[] = [];
    historicoDiario: HistoricoInsight[] = [];
    tendencias = {
        consistenciaRefeicoes: 0,
        metaHidratacao: 0,
        equilibrioCalorico: 0
    };
    recomendacoes: any[] = [];

    constructor(
        public dialogRef: MatDialogRef<HistoricoInsightsModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        this.carregarDadosHistorico();
    }

    private carregarDadosHistorico(): void {
        if (this.data) {
            this.resumoSemanal = this.data.resumoSemanal || this.resumoSemanal;
            this.historicoDiario = this.data.historicoDiario || [];
            this.insightsSemana = this.data.insightsSemana || [];
            this.tendencias = this.data.tendencias || this.tendencias;
            this.recomendacoes = this.data.recomendacoes || [];
        }
    }

    formatarData(data: string): string {
        const date = new Date(data);
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);

        if (date.toDateString() === hoje.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === ontem.toDateString()) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit'
            });
        }
    }

    obterClasseInsight(tipo: string): string {
        const classes = {
            'sucesso': 'bg-green-50 border-green-400',
            'atencao': 'bg-yellow-50 border-yellow-400',
            'alerta': 'bg-red-50 border-red-400',
            'info': 'bg-blue-50 border-blue-400'
        };
        return classes[tipo] || classes['info'];
    }

    obterCorIconeInsight(tipo: string): string {
        const cores = {
            'sucesso': 'text-green-600',
            'atencao': 'text-yellow-600',
            'alerta': 'text-red-600',
            'info': 'text-blue-600'
        };
        return cores[tipo] || cores['info'];
    }

    obterClasseRecomendacao(prioridade: string): string {
        const classes = {
            'alta': 'bg-red-50 border-red-400',
            'media': 'bg-yellow-50 border-yellow-400',
            'baixa': 'bg-green-50 border-green-400'
        };
        return classes[prioridade] || classes['baixa'];
    }

    exportarDados(): void {
        const dados = {
            resumoSemanal: this.resumoSemanal,
            historicoDiario: this.historicoDiario,
            tendencias: this.tendencias,
            dataExportacao: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `insights-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    fechar(): void {
        this.dialogRef.close();
    }
}
