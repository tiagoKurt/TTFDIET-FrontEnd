import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetasService } from 'app/modules/metas/metas.service';
import { Subject, takeUntil } from 'rxjs';
import {
    ModalMetaComponent,
    ModalMetaData,
} from './modal-meta/modal-meta.component';

export interface Meta {
    id?: number;
    tipoMeta: 'PESO' | 'AGUA' | 'CALORIAS';
    valorAtual: number;
    valorMeta: number;
    valorInicial: number;
    completa: boolean;
}

export interface ResumoMetas {
    totalMetas: number;
    metasCompletas: number;
    metasEmAndamento: number;
    ultimaAtualizacao: string;
}

@Component({
    selector: 'app-metas',
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
        MatMenuModule,
        MatTabsModule,
    ],
    templateUrl: './metas.component.html',
    styleUrls: ['./metas.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class MetasComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    metas: Meta[] = [];
    resumo: ResumoMetas = {
        totalMetas: 0,
        metasCompletas: 0,
        metasEmAndamento: 0,
        ultimaAtualizacao: '',
    };

    isLoading = false;
    selectedTabIndex = 0;

    constructor(
        private _metasService: MetasService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.carregarDados();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private carregarDados(): void {
        this.isLoading = true;

        this._metasService
            .listarMetas()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (metas) => {
                    this.metas = metas;
                    this.calcularResumo();
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Erro ao carregar metas:', error);
                    this.isLoading = false;
                },
            });
    }

    private calcularResumo(): void {
        this.resumo.totalMetas = this.metas.length;
        this.resumo.metasCompletas = this.metas.filter(
            (m) => m.completa
        ).length;
        this.resumo.metasEmAndamento = this.metas.filter(
            (m) => !m.completa
        ).length;
        this.resumo.ultimaAtualizacao = new Date().toLocaleString();
    }

    obterIconePorTipo(tipo: string): string {
        const icones = {
            PESO: 'scale',
            AGUA: 'water_drop',
            CALORIAS: 'local_fire_department',
        };
        return icones[tipo] || 'flag';
    }

    obterCorPorTipo(tipo: string): string {
        const cores = {
            PESO: 'text-blue-500',
            AGUA: 'text-cyan-500',
            CALORIAS: 'text-orange-500',
        };
        return cores[tipo] || 'text-gray-500';
    }

    obterLabelPorTipo(tipo: string): string {
        const labels = {
            PESO: 'Peso',
            AGUA: 'Hidratação',
            CALORIAS: 'Calorias',
        };
        return labels[tipo] || tipo;
    }

    obterUnidadePorTipo(tipo: string): string {
        const unidades = {
            PESO: 'kg',
            AGUA: 'ml',
            CALORIAS: 'kcal',
        };
        return unidades[tipo] || '';
    }

    calcularProgresso(meta: Meta): number {
        if (
            meta.valorMeta === meta.valorInicial ||
            meta.valorMeta === null ||
            meta.valorInicial === null ||
            meta.valorAtual === null
        )
            return 0;

        const diferencaTotal = meta.valorMeta - meta.valorInicial;
        const diferencaAtual = meta.valorAtual - meta.valorInicial;

        let progresso = (diferencaAtual / diferencaTotal) * 100;

        // Corrige progresso inverso se for meta de diminuir
        if (meta.valorMeta < meta.valorInicial) {
            progresso =
                ((meta.valorInicial - meta.valorAtual) /
                    (meta.valorInicial - meta.valorMeta)) *
                100;
        }

        return Math.max(0, Math.min(progresso, 100)); // Limita entre 0% e 100%
    }

    obterStatusMeta(meta: Meta): string {
        if (meta.completa) return 'Concluída';
        const progresso = this.calcularProgresso(meta);
        if (progresso >= 80) return 'Quase lá';
        if (progresso >= 50) return 'Em progresso';
        return 'Iniciando';
    }

    obterCorStatus(meta: Meta): string {
        if (meta.completa) return 'bg-green-100 text-green-800';
        const progresso = this.calcularProgresso(meta);
        if (progresso >= 80) return 'bg-yellow-100 text-yellow-800';
        if (progresso >= 50) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    }

    editarMeta(meta: Meta): void {
        if (meta.completa) {
            alert(
                'Esta meta já foi concluída e não pode ser editada. Crie uma nova meta se desejar.'
            );
            return;
        }

        const dialogData: ModalMetaData = {
            meta: meta,
            modo: 'editar',
        };

        const dialogRef = this.dialog.open(ModalMetaComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: dialogData,
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.success) {
                this.carregarDados();
            }
        });
    }

    excluirMeta(meta: Meta): void {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            this._metasService
                .excluirMeta(meta.id!)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: () => {
                        this.carregarDados();
                    },
                    error: (error) => {
                        console.error('Erro ao excluir meta:', error);
                    },
                });
        }
    }

    atualizarProgresso(meta: Meta): void {
        if (meta.completa) {
            alert(
                'Esta meta já foi concluída e não pode ter seu progresso atualizado.'
            );
            return;
        }

        const dialogData: ModalMetaData = {
            meta: meta,
            modo: 'progresso',
        };

        const dialogRef = this.dialog.open(ModalMetaComponent, {
            width: '450px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            data: dialogData,
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.success) {
                this.carregarDados();
            }
        });
    }

    adicionarNovaMeta(): void {
        const dialogData: ModalMetaData = {
            modo: 'criar',
        };

        const dialogRef = this.dialog.open(ModalMetaComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: dialogData,
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.success) {
                this.carregarDados();
            }
        });
    }

    criarNovaMeta(tipoMeta?: string): void {
        const dialogData: ModalMetaData = {
            modo: 'criar',
            meta: tipoMeta ? ({ tipoMeta } as Meta) : undefined,
        };

        const dialogRef = this.dialog.open(ModalMetaComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: dialogData,
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result?.success) {
                this.carregarDados();
            }
        });
    }

    obterMetasPorTipo(tipo: string): Meta[] {
        return this.metas.filter((m) => m.tipoMeta === tipo);
    }

    obterMetasCompletas(): Meta[] {
        return this.metas.filter((m) => m.completa);
    }

    obterMetasEmAndamento(): Meta[] {
        return this.metas.filter((m) => !m.completa);
    }

    trackByMeta(index: number, meta: Meta): number {
        return meta.id || index;
    }
}
