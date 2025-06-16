import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { RefeicoesService } from '../refeicoes.service';
import {
    AlimentoResponse,
    AlimentoUpdate,
    RefeicaoResponse,
    StatusRefeicao,
} from '../refeicoes.types';

@Component({
    selector: 'app-minhas-refeicoes',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatTooltipModule,
        MatTabsModule,
        MatChipsModule,
    ],
    templateUrl: './minhas-refeicoes.component.html',
    styleUrls: ['./minhas-refeicoes.component.scss'],
})
export class MinhasRefeicoesComponent implements OnInit {
    private _refeicoesService = inject(RefeicoesService);
    private _snackBar = inject(MatSnackBar);
    private _destroyRef = inject(DestroyRef);
    private _route = inject(ActivatedRoute);

    refeicoes: RefeicaoResponse[] = [];
    refeicoesPendentes: RefeicaoResponse[] = [];
    loading = false;
    alimentoEditando: { refeicaoId: number; alimentoId: number } | null = null;
    tabSelecionada = 0;

    ngOnInit(): void {
        this._route.queryParams.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(params => {
            if (params['tab'] === 'pendentes') {
                this.tabSelecionada = 1;
            }
        });

        this.carregarRefeicoes();
        this.carregarRefeicoesPendentes();
    }

    carregarRefeicoesPendentes(): void {
        this.loading = true;
        this._refeicoesService
            .buscarRefeicoesPendentes()
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (refeicoes) => {
                    this.refeicoesPendentes = refeicoes;
                },
                error: (error) => {
                    this._snackBar.open(
                        'Erro ao carregar refeições pendentes. Tente novamente.',
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
    }

    aceitarRefeicao(refeicaoId: number): void {
        this.loading = true;
        this._refeicoesService
            .aceitarRefeicao(refeicaoId)
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: () => {
                    this._snackBar.open(
                        'Refeição aceita com sucesso!',
                        'Fechar',
                        {
                            duration: 3000,
                            panelClass: ['success-snackbar'],
                        }
                    );
                    this.carregarRefeicoesPendentes();
                    this.carregarRefeicoes();
                },
                error: (error) => {
                    this._snackBar.open(
                        'Erro ao aceitar refeição. Tente novamente.',
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
    }

    rejeitarRefeicao(refeicaoId: number): void {
        if (confirm('Tem certeza que deseja rejeitar esta refeição? Ela será excluída permanentemente.')) {
            this.loading = true;
            this._refeicoesService
                .rejeitarRefeicao(refeicaoId)
                .pipe(
                    finalize(() => (this.loading = false)),
                    takeUntilDestroyed(this._destroyRef)
                )
                .subscribe({
                    next: () => {
                        this._snackBar.open(
                            'Refeição rejeitada e excluída!',
                            'Fechar',
                            {
                                duration: 3000,
                                panelClass: ['success-snackbar'],
                            }
                        );
                        this.carregarRefeicoesPendentes();
                    },
                    error: (error) => {
                        this._snackBar.open(
                            'Erro ao rejeitar refeição. Tente novamente.',
                            'Fechar',
                            {
                                duration: 5000,
                                panelClass: ['error-snackbar'],
                            }
                        );
                    },
                });
        }
    }

    carregarRefeicoes(): void {
        this.loading = true;
        this._refeicoesService
            .listarMinhasRefeicoes()
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (refeicoes) => {
                    this.refeicoes = refeicoes.filter(
                        (refeicao) =>
                            !refeicao.nome.includes(' - ') ||
                            (!refeicao.nome.includes('Segunda') &&
                                !refeicao.nome.includes('Terça') &&
                                !refeicao.nome.includes('Quarta') &&
                                !refeicao.nome.includes('Quinta') &&
                                !refeicao.nome.includes('Sexta') &&
                                !refeicao.nome.includes('Sábado') &&
                                !refeicao.nome.includes('Domingo'))
                    );
                },
                error: (error) => {
                    this._snackBar.open(
                        'Erro ao carregar refeições. Tente novamente.',
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
    }

    editarAlimento(refeicaoId: number, alimentoId: number): void {
        this.alimentoEditando = { refeicaoId, alimentoId };
    }

    salvarEdicaoAlimento(alimentoAtualizado: AlimentoUpdate): void {
        if (!this.alimentoEditando) return;

        this.loading = true;
        this._refeicoesService
            .atualizarAlimentoMinhasRefeicoes(
                this.alimentoEditando.refeicaoId,
                alimentoAtualizado
            )
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (alimentoAtualizadoResponse) => {
                    this._snackBar.open(
                        'Alimento atualizado com sucesso!',
                        'Fechar',
                        {
                            duration: 3000,
                            panelClass: ['success-snackbar'],
                        }
                    );

                    const refeicao = this.refeicoes.find(
                        (r) => r.id === this.alimentoEditando!.refeicaoId
                    );
                    if (refeicao) {
                        const alimentoIndex = refeicao.alimentos.findIndex(
                            (a) => a.id === this.alimentoEditando!.alimentoId
                        );
                        if (alimentoIndex >= 0) {
                            refeicao.alimentos[alimentoIndex] =
                                alimentoAtualizadoResponse;
                        }
                    }

                    this.cancelarEdicao();
                },
                error: (error) => {
                    this._snackBar.open(
                        'Erro ao atualizar alimento. Tente novamente.',
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
    }

    cancelarEdicao(): void {
        this.alimentoEditando = null;
    }

    excluirAlimento(refeicaoId: number, alimentoId: number): void {
        if (
            confirm('Tem certeza que deseja excluir este alimento da refeição?')
        ) {
            this.loading = true;
            this._refeicoesService
                .excluirAlimentoMinhasRefeicoes(refeicaoId, alimentoId)
                .pipe(
                    finalize(() => (this.loading = false)),
                    takeUntilDestroyed(this._destroyRef)
                )
                .subscribe({
                    next: () => {
                        this._snackBar.open(
                            'Alimento excluído com sucesso!',
                            'Fechar',
                            {
                                duration: 3000,
                                panelClass: ['success-snackbar'],
                            }
                        );

                        const refeicao = this.refeicoes.find(
                            (r) => r.id === refeicaoId
                        );
                        if (refeicao) {
                            refeicao.alimentos = refeicao.alimentos.filter(
                                (a) => a.id !== alimentoId
                            );
                        }
                    },
                    error: (error) => {
                        this._snackBar.open(
                            'Erro ao excluir alimento. Tente novamente.',
                            'Fechar',
                            {
                                duration: 5000,
                                panelClass: ['error-snackbar'],
                            }
                        );
                    },
                });
        }
    }
    excluirRefeicao(refeicaoId: number): void {
        if (confirm('Tem certeza que deseja excluir esta refeição?')) {
            this.loading = true;
            this._refeicoesService
                .excluirMinhaRefeicao(refeicaoId)
                .pipe(
                    finalize(() => (this.loading = false)),
                    takeUntilDestroyed(this._destroyRef)
                )
                .subscribe({
                    next: () => {
                        this._snackBar.open(
                            'Refeição excluída com sucesso!',
                            'Fechar',
                            {
                                duration: 3000,
                                panelClass: ['success-snackbar'],
                            }
                        );

                        const refeicao = this.refeicoes.find(
                            (r) => r.id === refeicaoId
                        );
                        if (refeicao) {
                            this.refeicoes = this.refeicoes.filter(
                                (r) => r.id !== refeicaoId
                            );
                        }
                    },
                    error: (error) => {
                        this._snackBar.open(
                            'Erro ao excluir refeição. Tente novamente.',
                            'Fechar',
                            {
                                duration: 5000,
                                panelClass: ['error-snackbar'],
                            }
                        );
                    },
                });
        }
    }
    trackByRefeicaoId(index: number, refeicao: RefeicaoResponse): number {
        return refeicao.id;
    }

    trackByAlimentoId(index: number, alimento: AlimentoResponse): number {
        return alimento.id || index;
    }

    getTotalCalorias(refeicao: RefeicaoResponse): number {
        return refeicao.alimentos.reduce(
            (total, alimento) => total + alimento.calorias,
            0
        );
    }

    getTotalProteinas(refeicao: RefeicaoResponse): number {
        return refeicao.alimentos.reduce(
            (total, alimento) => total + alimento.proteinas,
            0
        );
    }

    getTotalCarboidratos(refeicao: RefeicaoResponse): number {
        return refeicao.alimentos.reduce(
            (total, alimento) => total + alimento.carboidratos,
            0
        );
    }

    getTotalGorduras(refeicao: RefeicaoResponse): number {
        return refeicao.alimentos.reduce(
            (total, alimento) => total + alimento.gordura,
            0
        );
    }
}
