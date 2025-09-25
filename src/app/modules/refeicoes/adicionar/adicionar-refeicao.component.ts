import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormArray,
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { finalize } from 'rxjs';
import { RefeicoesService } from '../refeicoes.service';
import {
    AlimentoListItem,
    AlimentoResponse,
    RefeicaoRequest,
    RefeicaoResponse,
    TipoObjetivo,
    TipoRefeicao,
} from '../refeicoes.types';

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
        MatTooltipModule,
    ],
    templateUrl: './adicionar-refeicao.component.html',
    styleUrls: ['./adicionar-refeicao.component.scss'],
})
export class AdicionarRefeicaoComponent implements OnInit {
    private _formBuilder = inject(FormBuilder);
    private _refeicoesService = inject(RefeicoesService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _notificationService = inject(NotificationService);
    private _fuseConfirmationService = inject(FuseConfirmationService);
    private _destroyRef = inject(DestroyRef);
    private _httpClient = inject(HttpClient);
    private _dialog = inject(MatDialog);

    form: FormGroup;
    user: User | null = null;
    loading = false;
    resultado: RefeicaoResponse | null = null;
    alimentosDisponiveis: AlimentoListItem[] = [];
    editandoAlimento: AlimentoResponse | null = null;
    refeicoesPendentes: RefeicaoResponse[] = [];
    temRefeicaoPendente = false;

    metodoGeracao: 'preferencias' | 'imagem' = 'preferencias';
    selectedImage: File | null = null;
    imagePreview: string | null = null;
    isDragOver = false;

    tiposRefeicao: TipoRefeicao[] = [
        'Café da manhã',
        'Almoço',
        'Lanche da tarde',
        'Jantar',
        'Lanche da noite',
    ];

    objetivos: { value: TipoObjetivo; label: string }[] = [
        { value: 'perder peso', label: 'Perder Peso' },
        { value: 'manter peso', label: 'Manter Peso' },
        { value: 'ganhar massa', label: 'Ganhar Massa Muscular' },
    ];

    preferenciasPadrao: string[] = [];

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserProfile();
        this.setupFormWatchers();
        this.carregarAlimentosDisponiveis();
        this.verificarRefeicoesPendentes();
    }

    private initializeForm(): void {
        this.form = this._formBuilder.group({
            objetivo: ['', Validators.required],
            refeicao: ['', Validators.required],
            maximo_calorias_por_refeicao: [
                900,
                [
                    Validators.required,
                    Validators.min(100),
                    Validators.max(10000),
                ],
            ],
            preferencias_predefinidas: this._formBuilder.array([]),
            nova_preferencia: [''],
            preferencias_personalizadas: this._formBuilder.array([]),
        });
    }

    private loadUserProfile(): void {
        this._userService
            .getProfile()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (user) => {
                    this.user = user;
                },
                error: (error) => {
                    console.error('Erro ao carregar perfil do usuário:', error);
                },
            });
    }

    private verificarRefeicoesPendentes(): void {
        this._refeicoesService
            .verificarRefeicaoPendente()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (response) => {
                    this.temRefeicaoPendente = response.temPendente;
                    if (this.temRefeicaoPendente) {
                        this.carregarRefeicoesPendentes();
                    }
                },
                error: (error) => {
                    console.error(
                        'Erro ao verificar refeições pendentes:',
                        error
                    );
                },
            });
    }

    private carregarRefeicoesPendentes(): void {
        this._refeicoesService
            .buscarRefeicoesPendentes()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (refeicoes) => {
                    this.refeicoesPendentes = refeicoes;
                    if (refeicoes.length > 0) {
                        this.resultado = refeicoes[0];
                    }
                },
                error: (error) => {
                    console.error(
                        'Erro ao carregar refeições pendentes:',
                        error
                    );
                },
            });
    }

    private setupFormWatchers(): void {
        this.form
            .get('refeicao')
            ?.valueChanges.pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((refeicao: string) => {
                if (refeicao) {
                    this.updatePreferenciasPadrao(refeicao);
                }
            });
    }

    onMetodoGeracaoChange(): void {
        this.limparRefeicaoGerada();
        this.resetForm();
    }

    private limparRefeicaoGerada(): void {
        this.resultado = null;
        this.selectedImage = null;
        this.imagePreview = null;
    }

    private resetForm(): void {
        this.form.reset();
        this.form.patchValue({
            maximo_calorias_por_refeicao: 900,
        });
        this.preferenciasPadrao = [];
        this.updatePreferenciasPadrao('');
    }

    private updatePreferenciasPadrao(refeicao: string): void {
        this.preferenciasPadrao =
            this._refeicoesService.getPreferenciasPadrao(refeicao);

        const preferenciasPredefinidas = this.form.get(
            'preferencias_predefinidas'
        ) as FormArray;
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
        const novaPreferencia = this.form
            .get('nova_preferencia')
            ?.value?.trim();

        if (novaPreferencia) {
            this.preferenciasPersonalizadas.push(
                this._formBuilder.control(novaPreferencia)
            );
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

        return {
            objetivo: formValue.objetivo,
            peso: this.user?.peso,
            gasto_calorico_basal: this._refeicoesService.calcularGastoCalorico(
                this.user?.peso || 70,
                this.user?.altura || 170,
                this.user?.idade || 25,
                this.user?.sexo?.toString() || 'MASCULINO',
                this.user?.nivelAtividade?.toString() || 'MODERADO'
            ),
            refeicao: formValue.refeicao,
            preferencias: preferencias,
            maximo_calorias_por_refeicao:
                formValue.maximo_calorias_por_refeicao,
        };
    }

    onSubmit(): void {
        if (!this.form.valid) {
            this._snackBar.open(
                'Por favor, preencha todos os campos obrigatórios.',
                'Fechar',
                {
                    duration: 3000,
                    panelClass: ['error-snackbar'],
                }
            );
            return;
        }

        this.loading = true;
        const request = this.buildRequest();

        this._refeicoesService
            .gerarESalvarRefeicao(request)
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (response) => {
                    this.resultado = response;
                    if (!this.resultado.status) {
                        this.resultado.status = 'AGUARDANDO';
                    }
                    this.temRefeicaoPendente =
                        this.resultado.status === 'AGUARDANDO';

                    this._snackBar.open(
                        'Refeição gerada com sucesso! Agora você pode aceitar ou rejeitar.',
                        'Fechar',
                        {
                            duration: 4000,
                            panelClass: ['success-snackbar'],
                        }
                    );
                },
                error: (error) => {
                    console.error('Erro ao gerar refeição:', error);
                    this._snackBar.open(
                        'Erro ao gerar refeição. Tente novamente.',
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
    }

    aceitarRefeicao(): void {
        if (!this.resultado) return;

        this.loading = true;

        this._refeicoesService
            .aceitarRefeicao(this.resultado.id)
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (refeicaoAtualizada) => {
                    this._notificationService.success(
                        'Refeição aceita com sucesso! 🎉 A refeição foi adicionada ao seu planejamento de hoje.',
                        5000
                    );
                    this.resultado = refeicaoAtualizada;
                    this.resultado.status = 'ACEITA';
                    this.temRefeicaoPendente = false;
                    this.verificarRefeicoesPendentes();

                    // Aguarda um momento antes de limpar para o usuário ver o feedback
                    setTimeout(() => {
                        this.resetForm();
                        this.limparRefeicaoGerada();
                    }, 3000);
                },
                error: (error) => {
                    console.error('Erro ao aceitar refeição:', error);
                    this._notificationService.error(
                        'Erro ao aceitar refeição. Tente novamente.'
                    );
                },
            });
    }

    rejeitarRefeicao(): void {
        if (!this.resultado) return;

        const dialogRef = this._fuseConfirmationService.open({
            title: 'Rejeitar refeição',
            message:
                'Tem certeza que deseja rejeitar esta refeição? <span class="font-medium">Esta ação não pode ser desfeita!</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Rejeitar',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Cancelar',
                },
            },
            dismissible: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.executarRejeicao();
            }
        });
    }

    private executarRejeicao(): void {
        if (!this.resultado) return;

        this.loading = true;

        this._refeicoesService
            .rejeitarRefeicao(this.resultado.id)
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: () => {
                    this._notificationService.error(
                        'Refeição rejeitada e excluída 🗑️',
                        4000
                    );
                    this.resultado = null;
                    this.temRefeicaoPendente = false;
                    this.verificarRefeicoesPendentes();
                    this.resetForm();
                    this.limparRefeicaoGerada();
                },
                error: (error) => {
                    console.error('Erro ao rejeitar refeição:', error);
                    this._notificationService.error(
                        'Erro ao rejeitar refeição. Tente novamente.'
                    );
                },
            });
    }
    _toBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    }
    novaRefeicao(): void {
        this.resultado = null;
        this.temRefeicaoPendente = false;
        this.resetForm();
        this.limparRefeicaoGerada();
        this.verificarRefeicoesPendentes();
    }

    async analisarImagem(): Promise<void> {
        if (!this.selectedImage) {
            return;
        }

        this.loading = true;
        this.resultado = null;

        const formData = new FormData();
        formData.append('imagem', this.selectedImage);

        this._httpClient
            .post<RefeicaoResponse>(
                'https://ttfdietbackend.tigasolutions.com.br/api/refeicoes/gerar-por-foto',
                formData
            )
            .pipe(
                finalize(() => (this.loading = false)),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (response) => {
                    this.resultado = response;
                    if (!this.resultado.status) {
                        this.resultado.status = 'AGUARDANDO';
                    }
                    this.temRefeicaoPendente =
                        this.resultado.status === 'AGUARDANDO';

                    this._snackBar.open(
                        'Análise da imagem concluída com sucesso! Agora você pode aceitar ou rejeitar.',
                        'Fechar',
                        {
                            duration: 4000,
                            panelClass: ['success-snackbar'],
                        }
                    );
                },
                error: (error) => {
                    console.error('Erro ao analisar imagem:', error);
                    this._snackBar.open(
                        'Erro ao analisar a imagem. Tente novamente.' +
                            error.message,
                        'Fechar',
                        {
                            duration: 5000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                },
            });
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
            mensagem: this.editandoAlimento.mensagem,
        };

        this._refeicoesService
            .atualizarAlimento(this.resultado.id, alimentoUpdate)
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (alimentoAtualizado) => {
                    const index = this.resultado!.alimentos.findIndex(
                        (a) => a.id === alimentoAtualizado.id
                    );
                    if (index !== -1) {
                        this.resultado!.alimentos[index] = alimentoAtualizado;
                    }
                    this.editandoAlimento = null;
                    this._snackBar.open(
                        'Alimento atualizado com sucesso!',
                        'Fechar',
                        {
                            duration: 3000,
                            panelClass: ['success-snackbar'],
                        }
                    );
                },
                error: (error) => {
                    this._snackBar.open(
                        'Erro ao atualizar alimento.',
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
        this.editandoAlimento = null;
    }

    excluirAlimento(alimento: AlimentoResponse): void {
        if (!this.resultado) return;

        const dialogRef = this._fuseConfirmationService.open({
            title: 'Excluir alimento',
            message: `Tem certeza que deseja excluir <span class="font-medium">${alimento.nome}</span> da refeição?`,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Excluir',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Cancelar',
                },
            },
            dismissible: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed' && this.resultado) {
                this.resultado.alimentos = this.resultado.alimentos.filter(
                    (a) => a.id !== alimento.id
                );

                if (this.editandoAlimento?.id === alimento.id) {
                    this.editandoAlimento = null;
                }

                this._snackBar.open(
                    'Alimento excluído com sucesso!',
                    'Fechar',
                    {
                        duration: 3000,
                        panelClass: ['success-snackbar'],
                    }
                );

                if (this.resultado.alimentos.length === 0) {
                    this.resultado = null;
                    this._snackBar.open(
                        'Refeição vazia. Gere uma nova refeição.',
                        'Fechar',
                        {
                            duration: 4000,
                            panelClass: ['info-snackbar'],
                        }
                    );
                }
            }
        });
    }

    selecionarAlimentoDisponivel(alimentoSelecionado: AlimentoListItem): void {
        if (!this.editandoAlimento) return;

        this.editandoAlimento.nome = alimentoSelecionado.nome;
        this.editandoAlimento.quantidade = 100;
        this.editandoAlimento.calorias = alimentoSelecionado.calorias_por_100g;
        this.editandoAlimento.proteinas =
            alimentoSelecionado.proteinas_por_100g;
        this.editandoAlimento.carboidratos =
            alimentoSelecionado.carboidratos_por_100g;
        this.editandoAlimento.gordura = alimentoSelecionado.gordura_por_100g;
        this.editandoAlimento.unidade_medida = 'GRAMA';
    }

    getTotalCalorias(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce(
            (total, alimento) => total + alimento.calorias,
            0
        );
    }

    getTotalProteinas(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce(
            (total, alimento) => total + alimento.proteinas,
            0
        );
    }

    getTotalCarboidratos(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce(
            (total, alimento) => total + alimento.carboidratos,
            0
        );
    }

    getTotalGorduras(): number {
        if (!this.resultado) return 0;
        return this.resultado.alimentos.reduce(
            (total, alimento) => total + alimento.gordura,
            0
        );
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
            this._snackBar.open(
                'Por favor, selecione apenas arquivos de imagem.',
                'Fechar',
                {
                    duration: 3000,
                    panelClass: ['error-snackbar'],
                }
            );
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this._snackBar.open('A imagem deve ter no máximo 10MB.', 'Fechar', {
                duration: 3000,
                panelClass: ['error-snackbar'],
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

    private carregarAlimentosDisponiveis(): void {
        this._refeicoesService
            .listarAlimentos()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (alimentos) => {
                    this.alimentosDisponiveis = alimentos;
                },
                error: (error) => {
                    console.error('Erro ao carregar alimentos:', error);
                },
            });
    }
}
