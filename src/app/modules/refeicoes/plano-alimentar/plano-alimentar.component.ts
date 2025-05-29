import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RefeicoesService } from '../refeicoes.service';
import { UserService } from 'app/core/user/user.service';
import { TipoRefeicao, TipoObjetivo, AlimentoResponse, RefeicaoRequest, PlanoAlimentarResponse } from '../refeicoes.types';
import { User } from 'app/core/user/user.types';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-plano-alimentar',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatExpansionModule
    ],
    templateUrl: './plano-alimentar.component.html',
    styleUrls: ['./plano-alimentar.component.scss']
})
export class PlanoAlimentarComponent implements OnInit {
    private _formBuilder = inject(FormBuilder);
    private _refeicoesService = inject(RefeicoesService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _destroyRef = inject(DestroyRef);

    form: FormGroup;
    user: User | null = null;
    loading = false;
    resultado: PlanoAlimentarResponse | null = null;
    planoSemanal: { [refeicao: string]: { [dia: string]: AlimentoResponse[] } } | null = null;

    tiposRefeicao: TipoRefeicao[] = [
        'Café da manhã',
        'Almoço',
        'Lanche da tarde',
        'Jantar',
        'Lanche da noite'
    ];

    objetivos: { value: TipoObjetivo; label: string }[] = [
        { value: 'perder peso', label: 'Perder Peso' },
        { value: 'manter peso', label: 'Manter Peso' },
        { value: 'ganhar massa', label: 'Ganhar Massa Muscular' }
    ];

    diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado-feira', 'Domingo-feira'];
    preferenciasPadrao: string[] = [];

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserProfile();
        this.setupFormWatchers();
    }

    private initializeForm(): void {
        this.form = this._formBuilder.group({
            objetivo: ['', Validators.required],
            maximo_calorias_por_refeicao: [900, [Validators.required, Validators.min(100), Validators.max(10000)]],
            preferencias_predefinidas: this._formBuilder.array([]),
            nova_preferencia: [''],
            preferencias_personalizadas: this._formBuilder.array([])
        });
    }

    private loadUserProfile(): void {
        this._userService.getProfile()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (user) => {
                    this.user = user;
                },
                error: (error) => {
                }
            });
    }

    private setupFormWatchers(): void {
        this.updatePreferenciasPadrao('Almoço');
    }

    private updatePreferenciasPadrao(refeicao: string): void {
        this.preferenciasPadrao = this._refeicoesService.getPreferenciasPadrao(refeicao);

        const preferenciasPredefinidas = this.form.get('preferencias_predefinidas') as FormArray;
        preferenciasPredefinidas.clear();

        this.preferenciasPadrao.forEach(() => {
            preferenciasPredefinidas.push(this._formBuilder.control(false));
        });
    }

    get preferenciasPredefinidas(): FormArray {
        return this.form.get('preferencias_predefinidas') as FormArray;
    }

    get preferenciasPersonalizadas(): FormArray {
        return this.form.get('preferencias_personalizadas') as FormArray;
    }

    adicionarPreferenciaPersonalizada(): void {
        const novaPreferencia = this.form.get('nova_preferencia')?.value?.trim();

        if (novaPreferencia) {
            this.preferenciasPersonalizadas.push(this._formBuilder.control(novaPreferencia));
            this.form.get('nova_preferencia')?.setValue('');
        }
    }

    removerPreferenciaPersonalizada(index: number): void {
        this.preferenciasPersonalizadas.removeAt(index);
    }

    private getPreferenciasSelecionadas(): string[] {
        const preferencias: string[] = [];

        const predefinidasValues = this.preferenciasPredefinidas.value;
        this.preferenciasPadrao.forEach((pref, index) => {
            if (predefinidasValues[index]) {
                preferencias.push(pref);
            }
        });

        const personalizadasValues = this.preferenciasPersonalizadas.value;
        preferencias.push(...personalizadasValues);

        return preferencias;
    }

    private buildRequest(): RefeicaoRequest {
        const formValue = this.form.value;
        const preferencias = this.getPreferenciasSelecionadas();

        const request: RefeicaoRequest = {
            objetivo: formValue.objetivo,
            refeicao: 'Almoço',
            preferencias: preferencias,
            maximo_calorias_por_refeicao: formValue.maximo_calorias_por_refeicao
        };

        if (this.user?.peso) {
            request.peso = this.user.peso;
        }

        if (this.user?.peso && this.user?.altura && this.user?.idade && this.user?.sexo && this.user?.nivelAtividade) {
            request.gasto_calorico_basal = this._refeicoesService.calcularGastoCalorico(
                this.user.peso,
                this.user.altura,
                this.user.idade,
                this.user.sexo,
                this.user.nivelAtividade
            );
        }

        return request;
    }

    private diagnosticarEstrutura(response: any): void {

        Object.keys(response).forEach(chave => {
            const valor = response[chave];
            if (Array.isArray(valor)) {
            } else if (typeof valor === 'object' && valor !== null) {
                Object.keys(valor).forEach(subChave => {
                    const subValor = valor[subChave];
                    if (Array.isArray(subValor)) {

                    } else if (typeof subValor === 'object' && subValor !== null) {

                    }
                });
            } else {
            }
        });
    }

    onSubmit(): void {
        if (this.form.valid) {
            this.loading = true;
            this.resultado = null;
            this.planoSemanal = null;

            const request = this.buildRequest();

            this._refeicoesService.gerarPlanoAlimentar(request)
                .pipe(
                    finalize(() => this.loading = false),
                    takeUntilDestroyed(this._destroyRef)
                )
                .subscribe({
                    next: (response) => {
                        this.diagnosticarEstrutura(response);
                        this.resultado = response;

                        if (response.plano_alimentar_semanal) {
                            this.planoSemanal = response.plano_alimentar_semanal;
                        } else {

                        }

                        this._snackBar.open('Plano alimentar gerado com sucesso!', 'Fechar', {
                            duration: 3000,
                            panelClass: ['success-snackbar']
                        });
                    },
                    error: (error) => {
                        this._snackBar.open('Erro ao gerar plano alimentar. Tente novamente.', 'Fechar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        } else {
            Object.keys(this.form.controls).forEach(key => {
                const control = this.form.get(key);
                if (control && control.errors) {
                }
            });
        }
    }

    getTotalCaloriasDia(refeicao: string, dia: string): number {
        if (!this.planoSemanal) return 0;
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return 0;
        const alimentosDia = dadosRefeicao[dia];
        if (!alimentosDia) return 0;
        return alimentosDia.reduce((total, alimento) => total + alimento.calorias, 0);
    }

    getTotalProteinasDia(refeicao: string, dia: string): number {
        if (!this.planoSemanal) return 0;
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return 0;
        const alimentosDia = dadosRefeicao[dia];
        if (!alimentosDia) return 0;
        return alimentosDia.reduce((total, alimento) => total + alimento.proteinas, 0);
    }

    getTotalCarboidratosDia(refeicao: string, dia: string): number {
        if (!this.planoSemanal) return 0;
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return 0;
        const alimentosDia = dadosRefeicao[dia];
        if (!alimentosDia) return 0;
        return alimentosDia.reduce((total, alimento) => total + alimento.carboidratos, 0);
    }

    getTotalGordurasDia(refeicao: string, dia: string): number {
        if (!this.planoSemanal) return 0;
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return 0;
        const alimentosDia = dadosRefeicao[dia];
        if (!alimentosDia) return 0;
        return alimentosDia.reduce((total, alimento) => total + alimento.gordura, 0);
    }

    getRefeicoesDisponiveis(): string[] {
        if (!this.planoSemanal) return [];
        return Object.keys(this.planoSemanal);
    }

    getDiasComRefeicoes(refeicao: string): string[] {
        if (!this.planoSemanal) return [];
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return [];
        return Object.keys(dadosRefeicao);
    }

    getAlimentosDia(refeicao: string, dia: string): AlimentoResponse[] {
        if (!this.planoSemanal) return [];
        const dadosRefeicao = this.planoSemanal[refeicao];
        if (!dadosRefeicao) return [];
        return dadosRefeicao[dia] || [];
    }

    novoPlano(): void {
        this.resultado = null;
        this.planoSemanal = null;
        this.form.reset();
        this.form.patchValue({
            maximo_calorias_por_refeicao: 900
        });
    }

    getTotalCaloriasSemana(): number {
        if (!this.planoSemanal) return 0;
        let total = 0;

        Object.keys(this.planoSemanal).forEach(refeicao => {
            const dadosRefeicao = this.planoSemanal![refeicao];
            Object.keys(dadosRefeicao).forEach(dia => {
                total += this.getTotalCaloriasDia(refeicao, dia);
            });
        });

        return total;
    }

    getMediaCaloriasDia(): number {
        const totalCalorias = this.getTotalCaloriasSemana();
        const totalDias = this.diasSemana.length;
        return Math.round(totalCalorias / totalDias);
    }

    getDiasDisponiveis(): string[] {
        if (!this.planoSemanal) return [];

        const diasSet = new Set<string>();
        Object.keys(this.planoSemanal).forEach(refeicao => {
            const dadosRefeicao = this.planoSemanal![refeicao];
            Object.keys(dadosRefeicao).forEach(dia => {
                diasSet.add(dia);
            });
        });

        const ordenacaoDias = [
            'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira',
            'Sexta-feira', 'Sabado-feira', 'Domingo-feira'
        ];

        return Array.from(diasSet).sort((a, b) => {
            const indexA = ordenacaoDias.indexOf(a);
            const indexB = ordenacaoDias.indexOf(b);
            return indexA - indexB;
        });
    }

    getTotalCaloriasDoDia(dia: string): number {
        if (!this.planoSemanal) return 0;
        let total = 0;

        Object.keys(this.planoSemanal).forEach(refeicao => {
            total += this.getTotalCaloriasDia(refeicao, dia);
        });

        return total;
    }

    getTotalProteinasDoDia(dia: string): number {
        if (!this.planoSemanal) return 0;
        let total = 0;

        Object.keys(this.planoSemanal).forEach(refeicao => {
            total += this.getTotalProteinasDia(refeicao, dia);
        });

        return total;
    }

    getTotalCarboidratosDoDia(dia: string): number {
        if (!this.planoSemanal) return 0;
        let total = 0;

        Object.keys(this.planoSemanal).forEach(refeicao => {
            total += this.getTotalCarboidratosDia(refeicao, dia);
        });

        return total;
    }

    getTotalGordurasDoDia(dia: string): number {
        if (!this.planoSemanal) return 0;
        let total = 0;

        Object.keys(this.planoSemanal).forEach(refeicao => {
            total += this.getTotalGordurasDia(refeicao, dia);
        });

        return total;
    }
}
