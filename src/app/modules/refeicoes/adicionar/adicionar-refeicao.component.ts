import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { RefeicoesService } from '../refeicoes.service';
import { UserService } from 'app/core/user/user.service';
import { TipoRefeicao, TipoObjetivo, AlimentoResponse, RefeicaoRequest, RefeicaoResponse, AlimentoListItem } from '../refeicoes.types';
import { User } from 'app/core/user/user.types';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-adicionar-refeicao',
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
        MatCheckboxModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatDialogModule,
        MatTooltipModule
    ],
    templateUrl: './adicionar-refeicao.component.html',
    styleUrls: ['./adicionar-refeicao.component.scss']
})
export class AdicionarRefeicaoComponent implements OnInit {
    private _formBuilder = inject(FormBuilder);
    private _refeicoesService = inject(RefeicoesService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _destroyRef = inject(DestroyRef);
    private _httpClient = inject(HttpClient);
    private _dialog = inject(MatDialog);

    form: FormGroup;
    user: User | null = null;
    loading = false;
    resultado: RefeicaoResponse | null = null;
    alimentosDisponiveis: AlimentoListItem[] = [];
    editandoAlimento: AlimentoResponse | null = null;

    metodoGeracao: 'preferencias' | 'imagem' = 'preferencias';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    isDragOver = false;

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

    preferenciasPadrao: string[] = [];

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserProfile();
        this.setupFormWatchers();
        this.carregarAlimentosDisponiveis();
    }

    private initializeForm(): void {
        this.form = this._formBuilder.group({
            objetivo: ['', Validators.required],
            refeicao: ['', Validators.required],
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
                    console.error('Erro ao carregar perfil do usuário:', error);
                }
            });
    }

    private setupFormWatchers(): void {
        this.form.get('refeicao')?.valueChanges
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((refeicao: string) => {
                if (refeicao) {
                    this.updatePreferenciasPadrao(refeicao);
                }
            });
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
            refeicao: formValue.refeicao,
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

    onSubmit(): void {
        if (this.form.valid) {
            this.loading = true;
            this.resultado = null;

            const request = this.buildRequest();

            this._refeicoesService.gerarESalvarRefeicao(request)
                .pipe(
                    finalize(() => this.loading = false),
                    takeUntilDestroyed(this._destroyRef)
                )
                .subscribe({
                    next: (response) => {
                        this.resultado = response;
                        this._snackBar.open('Refeição gerada e salva com sucesso!', 'Fechar', {
                            duration: 3000,
                            panelClass: ['success-snackbar']
                        });
                    },
                    error: (error) => {
                        this._snackBar.open('Erro ao gerar refeição. Tente novamente.', 'Fechar', {
                            duration: 5000,
                            panelClass: ['error-snackbar']
                        });
                    }
                });
        }
    }

    editarAlimento(alimento: AlimentoResponse): void {
        this.editandoAlimento = { ...alimento };
    }

    salvarEdicaoAlimento(): void {
        if (!this.editandoAlimento || !this.resultado) return;

        const alimentoUpdate = {
            id: this.editandoAlimento.id!,
            nome: this.editandoAlimento.nome,
            quantidade: this.editandoAlimento.quantidade,
            calorias: this.editandoAlimento.calorias,
            proteinas: this.editandoAlimento.proteinas,
            carboidratos: this.editandoAlimento.carboidratos,
            gordura: this.editandoAlimento.gordura,
            unidade_medida: this.editandoAlimento.unidade_medida,
            mensagem: this.editandoAlimento.mensagem
        };

        this._refeicoesService.atualizarAlimento(this.resultado.id, alimentoUpdate)
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (alimentoAtualizado) => {
                    const index = this.resultado!.alimentos.findIndex(a => a.id === alimentoAtualizado.id);
                    if (index !== -1) {
                        this.resultado!.alimentos[index] = alimentoAtualizado;
                    }
                    this.editandoAlimento = null;
                    this._snackBar.open('Alimento atualizado com sucesso!', 'Fechar', {
                        duration: 3000,
                        panelClass: ['success-snackbar']
                    });
                },
                error: (error) => {
                    this._snackBar.open('Erro ao atualizar alimento.', 'Fechar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    cancelarEdicao(): void {
        this.editandoAlimento = null;
    }

    selecionarAlimentoDisponivel(alimentoSelecionado: AlimentoListItem): void {
        if (!this.editandoAlimento) return;

        this.editandoAlimento.nome = alimentoSelecionado.nome;
        this.editandoAlimento.quantidade = 100;
        this.editandoAlimento.calorias = alimentoSelecionado.calorias_por_100g;
        this.editandoAlimento.proteinas = alimentoSelecionado.proteinas_por_100g;
        this.editandoAlimento.carboidratos = alimentoSelecionado.carboidratos_por_100g;
        this.editandoAlimento.gordura = alimentoSelecionado.gordura_por_100g;
        this.editandoAlimento.unidade_medida = 'GRAMA';
    }

    getTotalCalorias(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce((total, alimento) => total + alimento.calorias, 0);
    }

    getTotalProteinas(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce((total, alimento) => total + alimento.proteinas, 0);
    }

    getTotalCarboidratos(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce((total, alimento) => total + alimento.carboidratos, 0);
    }

    getTotalGorduras(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce((total, alimento) => total + alimento.gordura, 0);
    }

    novaRefeicao(): void {
        this.resultado = null;
        this.form.reset();
        this.form.patchValue({
            maximo_calorias_por_refeicao: 900
        });

        this.selectedImage = null;
        this.imagePreview = null;
        this.metodoGeracao = 'preferencias';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFileSelection(files[0]);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFileSelection(input.files[0]);
        }
    }

    private handleFileSelection(file: File): void {
        if (!file.type.startsWith('image/')) {
            this._snackBar.open('Por favor, selecione apenas arquivos de imagem.', 'Fechar', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this._snackBar.open('A imagem deve ter no máximo 10MB.', 'Fechar', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
            return;
        }

        this.selectedImage = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    removeImage(): void {
        this.selectedImage = null;
        this.imagePreview = null;
    }

    analisarImagem(): void {
        if (!this.selectedImage) {
            return;
        }

        this.loading = true;
        this.resultado = null;

        const formData = new FormData();
        formData.append('imagem', this.selectedImage);

        this._httpClient.post<RefeicaoResponse>('http://localhost:8080/api/refeicoes/gerar-por-foto', formData)
            .pipe(
                finalize(() => this.loading = false),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (response) => {
                    this.resultado = response;

                    this._snackBar.open('Análise da imagem concluída com sucesso!', 'Fechar', {
                        duration: 3000,
                        panelClass: ['success-snackbar']
                    });
                },
                error: (error) => {
                    console.error('Erro ao analisar imagem:', error);
                    this._snackBar.open('Erro ao analisar a imagem. Tente novamente.', 'Fechar', {
                        duration: 5000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    private carregarAlimentosDisponiveis(): void {
        this._refeicoesService.listarAlimentos()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (alimentos) => {
                    this.alimentosDisponiveis = alimentos;
                },
                error: (error) => {
                    console.error('Erro ao carregar alimentos:', error);
                }
            });
    }
}
