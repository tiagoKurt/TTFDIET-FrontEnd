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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RefeicoesService } from '../../refeicoes/refeicoes.service';
import { UserService } from 'app/core/user/user.service';
import { NotificationService } from 'app/core/services/notification.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { TipoRefeicao, TipoObjetivo, AlimentoResponse, RefeicaoRequest, PlanoAlimentarResponse, PlanoAlimentarDetalhado, AlimentoListItem, AlimentoUpdate } from '../../refeicoes/refeicoes.types';
import { User } from 'app/core/user/user.types';
import { finalize } from 'rxjs';

interface RefeicaoPlano {
    id?: number;
    tipoRefeicao: string;
    dia: string;
    alimentos: AlimentoResponse[];
    totalCalorias: number;
    totalProteinas: number;
    totalCarboidratos: number;
    totalGorduras: number;
    aceita: boolean;
}

interface DiaPlano {
    dia: string;
    diaSemana: string;
    refeicoes: RefeicaoPlano[];
    totalCalorias: number;
    aceito: boolean;
}

@Component({
    selector: 'app-plano-alimentar-aceitar',
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
        MatExpansionModule,
        MatDialogModule,
        MatTooltipModule
    ],
    templateUrl: './plano-alimentar-aceitar.component.html'
})
export class PlanoAlimentarAceitarComponent implements OnInit {
    private _formBuilder = inject(FormBuilder);
    private _refeicoesService = inject(RefeicoesService);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _notificationService = inject(NotificationService);
    private _fuseConfirmationService = inject(FuseConfirmationService);
    private _destroyRef = inject(DestroyRef);
    private _dialog = inject(MatDialog);

    form: FormGroup;
    user: User | null = null;
    loading = false;
    resultado: PlanoAlimentarResponse | null = null;
    planoSemanal: { [refeicao: string]: { [dia: string]: AlimentoResponse[] } } | null = null;
    diasPlano: DiaPlano[] = [];
    planoGerado = false;

    planosSalvos: PlanoAlimentarDetalhado[] = [];
    planoSelecionado: PlanoAlimentarDetalhado | null = null;
    alimentosDisponiveis: AlimentoListItem[] = [];
    alimentoEditando: { planoId: number; refeicaoId: number; alimentoId: number } | null = null;
    modoVisualizacao: 'gerar' | 'visualizar' | 'historico' = 'gerar';

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

    diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    preferenciasPadrao: string[] = [];

    ngOnInit(): void {
        this.initializeForm();
        this.loadUserProfile();
        this.setupFormWatchers();
        this.carregarPlanosSalvos();
        this.carregarAlimentosDisponiveis();
    }

    private initializeForm(): void {
        this.form = this._formBuilder.group({
            objetivo: ['HIPERTROFIA', Validators.required],
            refeicao: ['Café da manhã', Validators.required],
            maximo_calorias_por_refeicao: [900, [Validators.required, Validators.min(100), Validators.max(2000)]],
            preferenciasPredefinidas: this._formBuilder.array([]),
            preferenciasPersonalizadas: this._formBuilder.array([])
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
                    console.error('Erro ao carregar perfil:', error);
                }
            });
    }

    private setupFormWatchers(): void {
        this.updatePreferenciasPadrao('Almoço');
    }

    private updatePreferenciasPadrao(refeicao: string): void {
        this.preferenciasPadrao = this._refeicoesService.getPreferenciasPadrao(refeicao);

        const preferenciasPredefinidas = this.form.get('preferenciasPredefinidas') as FormArray;
        preferenciasPredefinidas.clear();

        this.preferenciasPadrao.forEach(() => {
            preferenciasPredefinidas.push(this._formBuilder.control(false));
        });
    }

    get preferenciasPredefinidas(): FormArray {
        return this.form.get('preferenciasPredefinidas') as FormArray;
    }

    get preferenciasPersonalizadas(): FormArray {
        return this.form.get('preferenciasPersonalizadas') as FormArray;
    }

    adicionarPreferenciaPersonalizada(): void {
        const novaPreferencia = this.form.get('preferenciasPersonalizadas')?.value?.trim();

        if (novaPreferencia) {
            this.preferenciasPersonalizadas.push(this._formBuilder.control(novaPreferencia));
            this.form.get('preferenciasPersonalizadas')?.setValue('');
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
        if (!this.form.valid) {
            this._snackBar.open('Por favor, preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
            return;
        }

        this.loading = true;
        const request = this.buildRequest();

        this._refeicoesService.gerarPlanoAlimentar(request)
            .pipe(
                finalize(() => this.loading = false),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe({
                next: (response) => {
                    console.log('Plano gerado (sem salvar refeições):', response);
                    this.resultado = response;
                    this.planoSemanal = response.plano_alimentar_semanal;
                    this.organizarPlanoSemanal();
                    this.planoGerado = true;
                    this._snackBar.open('Plano alimentar gerado com sucesso! Aceite as refeições que desejar.', 'Fechar', { duration: 3000 });
                },
                error: (error) => {
                    console.error('Erro ao gerar plano:', error);
                    this._snackBar.open('Erro ao gerar plano alimentar', 'Fechar', { duration: 5000 });
                }
            });
    }

    private organizarPlanoSemanal(): void {
        if (!this.planoSemanal) return;

        this.diasPlano = [];
        const diasOrdem = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

        const diasComDatas: { dia: string; data: Date; diasPlano: any }[] = [];

        diasOrdem.forEach(dia => {
            const refeicoesDia: RefeicaoPlano[] = [];
            let totalCaloriasDia = 0;

            Object.keys(this.planoSemanal!).forEach(tipoRefeicao => {
                const alimentosDia = this.planoSemanal![tipoRefeicao][dia];
                if (alimentosDia && alimentosDia.length > 0) {
                    const totalCalorias = alimentosDia.reduce((sum, alimento) => sum + alimento.calorias, 0);
                    const totalProteinas = alimentosDia.reduce((sum, alimento) => sum + alimento.proteinas, 0);
                    const totalCarboidratos = alimentosDia.reduce((sum, alimento) => sum + alimento.carboidratos, 0);
                    const totalGorduras = alimentosDia.reduce((sum, alimento) => sum + alimento.gordura, 0);

                    refeicoesDia.push({
                        tipoRefeicao,
                        dia,
                        alimentos: alimentosDia,
                        totalCalorias,
                        totalProteinas,
                        totalCarboidratos,
                        totalGorduras,
                        aceita: false
                    });

                    totalCaloriasDia += totalCalorias;
                }
            });

            if (refeicoesDia.length > 0) {
                const dataParaDia = this.obterDataParaDia(dia);
                const diaComData = this.formatarDiaComData(dia, dataParaDia);

                diasComDatas.push({
                    dia,
                    data: dataParaDia,
                    diasPlano: {
                        dia,
                        diaSemana: diaComData,
                        refeicoes: refeicoesDia,
                        totalCalorias: totalCaloriasDia,
                        aceito: false
                    }
                });
            }
        });

        diasComDatas.sort((a, b) => a.data.getTime() - b.data.getTime());

        this.diasPlano = diasComDatas.map(item => item.diasPlano);
    }

    private formatarDiaComData(diaSemana: string, data: Date): string {
        const dataFormatada = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
        return `${diaSemana} ${dataFormatada}`;
    }

    aceitarRefeicao(diaIndex: number, refeicaoIndex: number): void {
        const dia = this.diasPlano[diaIndex];
        const refeicao = dia.refeicoes[refeicaoIndex];

        const dialogRef = this._fuseConfirmationService.open({
            title: 'Aceitar Refeição',
            message: `Deseja aceitar a refeição "${refeicao.tipoRefeicao}" de ${dia.diaSemana}? Ela será adicionada ao seu planejamento para hoje.`,
            actions: {
                confirm: {
                    label: 'Aceitar'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.processarAceitacaoRefeicao(refeicao);
            }
        });
    }

    aceitarDiaCompleto(diaIndex: number): void {
        const dia = this.diasPlano[diaIndex];

        const dialogRef = this._fuseConfirmationService.open({
            title: 'Aceitar Dia Completo',
            message: `Deseja aceitar todas as ${dia.refeicoes.length} refeições de ${dia.diaSemana}? Elas serão adicionadas ao seu planejamento para hoje.`,
            actions: {
                confirm: {
                    label: 'Aceitar Todas'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                dia.refeicoes.forEach(refeicao => {
                    this.processarAceitacaoRefeicao(refeicao);
                });
                dia.aceito = true;
            }
        });
    }

    private processarAceitacaoRefeicao(refeicao: RefeicaoPlano): void {
        const dataRefeicao = this.obterDataParaDia(refeicao.dia);
        const horaRefeicao = this.obterHoraParaTipoRefeicao(refeicao.tipoRefeicao);

        const dataHoraRefeicao = new Date(dataRefeicao);
        dataHoraRefeicao.setHours(horaRefeicao.hora, horaRefeicao.minuto, 0, 0);

        const alimentosConvertidos = refeicao.alimentos.map(alimento => ({
            nome: alimento.nome,
            quantidade: alimento.quantidade,
            calorias: alimento.calorias,
            proteinas: alimento.proteinas,
            carboidratos: alimento.carboidratos,
            gordura: alimento.gordura,
            unidade_medida: this.converterUnidadeMedida(alimento.unidade_medida),
            mensagem: alimento.mensagem || ''
        }));

        const refeicaoRequest = {
            nome: refeicao.tipoRefeicao,
            dataHoraRefeicao: dataHoraRefeicao.toISOString(),
            observacao: `Aceito do plano alimentar - ${refeicao.dia}`,
            alimentos: alimentosConvertidos
        };

        this._refeicoesService.adicionarRefeicao(refeicaoRequest)
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: () => {
                    refeicao.aceita = true;
                    const dataFormatada = this.formatarDataCompleta(dataRefeicao);
                    this._snackBar.open(`Refeição "${refeicao.tipoRefeicao}" aceita para ${dataFormatada}!`, 'Fechar', { duration: 3000 });
                },
                error: (error) => {
                    console.error('Erro ao aceitar refeição:', error);
                    this._snackBar.open('Erro ao aceitar refeição', 'Fechar', { duration: 3000 });
                }
            });
    }

    private converterUnidadeMedida(unidadeApi: string): string {
        const mapeamento: { [key: string]: string } = {
            'gramas': 'GRAMA',
            'grama': 'GRAMA',
            'g': 'GRAMA',
            'quilogramas': 'QUILOGRAMA',
            'quilograma': 'QUILOGRAMA',
            'kg': 'QUILOGRAMA',
            'mililitros': 'MILILITRO',
            'mililitro': 'MILILITRO',
            'ml': 'MILILITRO',
            'litros': 'LITRO',
            'litro': 'LITRO',
            'l': 'LITRO',
            'unidades': 'UNIDADE',
            'unidade': 'UNIDADE',
            'unid': 'UNIDADE',
            'fatias': 'FATIA',
            'fatia': 'FATIA',
            'porcoes': 'PORCAO',
            'porcao': 'PORCAO',
            'porção': 'PORCAO',
            'porções': 'PORCAO',
            'xicara': 'XICARA',
            'xícaras': 'XICARA',
            'colher de sopa': 'COLHER_DE_SOPA',
            'colheres de sopa': 'COLHER_DE_SOPA',
            'colher de cha': 'COLHER_DE_CHA',
            'colheres de cha': 'COLHER_DE_CHA',
            'colher de chá': 'COLHER_DE_CHA',
            'colheres de chá': 'COLHER_DE_CHA',
            'scoops': 'SCOOP',
            'scoop': 'SCOOP',
            'unidade pequena': 'UNIDADE_PEQUENA',
            'unidade media': 'UNIDADE_MEDIA',
            'unidade média': 'UNIDADE_MEDIA',
            'unidade grande': 'UNIDADE_GRANDE'
        };

        const unidadeLower = unidadeApi.toLowerCase().trim();
        return mapeamento[unidadeLower] || 'GRAMA';
    }

    private obterDataParaDia(diaSemana: string): Date {
        const hoje = new Date();
        const diaAtual = hoje.getDay();

        const diasSemanaMap: { [key: string]: number } = {
            'Segunda-feira': 1,
            'Terça-feira': 2,
            'Quarta-feira': 3,
            'Quinta-feira': 4,
            'Sexta-feira': 5,
            'Sábado': 6,
            'Domingo': 0
        };

        const diaDesejado = diasSemanaMap[diaSemana];
        let diasParaAdicionar = diaDesejado - diaAtual;

        if (diasParaAdicionar < 0) {
            diasParaAdicionar += 7;
        }

        const dataResultado = new Date(hoje);
        dataResultado.setDate(hoje.getDate() + diasParaAdicionar);
        return dataResultado;
    }

    private obterHoraParaTipoRefeicao(tipoRefeicao: string): { hora: number; minuto: number } {
        const horasRefeicao: { [key: string]: { hora: number; minuto: number } } = {
            'Café da manhã': { hora: 7, minuto: 30 },
            'Lanche da manhã': { hora: 10, minuto: 0 },
            'Almoço': { hora: 12, minuto: 30 },
            'Lanche da tarde': { hora: 15, minuto: 30 },
            'Jantar': { hora: 19, minuto: 0 },
            'Lanche da noite': { hora: 21, minuto: 30 }
        };

        return horasRefeicao[tipoRefeicao] || { hora: 12, minuto: 0 };
    }

    private formatarDataCompleta(data: Date): string {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit'
        });
    }

    excluirRefeicao(diaIndex: number, refeicaoIndex: number): void {
        const dia = this.diasPlano[diaIndex];
        const refeicao = dia.refeicoes[refeicaoIndex];

        const dialogRef = this._fuseConfirmationService.open({
            title: 'Excluir Refeição',
            message: `Deseja excluir a refeição "${refeicao.tipoRefeicao}" de ${dia.diaSemana}?`,
            actions: {
                confirm: {
                    label: 'Excluir',
                    color: 'warn'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                dia.refeicoes.splice(refeicaoIndex, 1);
                dia.totalCalorias = dia.refeicoes.reduce((sum, r) => sum + r.totalCalorias, 0);

                if (dia.refeicoes.length === 0) {
                    this.diasPlano.splice(diaIndex, 1);
                }

                this._snackBar.open('Refeição excluída do plano', 'Fechar', { duration: 3000 });
            }
        });
    }

    excluirPlanoCompleto(): void {
        const dialogRef = this._fuseConfirmationService.open({
            title: 'Excluir Plano Completo',
            message: 'Deseja excluir todo o plano alimentar semanal? Esta ação não pode ser desfeita.',
            actions: {
                confirm: {
                    label: 'Excluir Tudo',
                    color: 'warn'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.diasPlano = [];
                this.planoSemanal = null;
                this.resultado = null;
                this.planoGerado = false;
                this._snackBar.open('Plano alimentar excluído', 'Fechar', { duration: 3000 });
            }
        });
    }

    novoPlano(): void {
        this.diasPlano = [];
        this.planoSemanal = null;
        this.resultado = null;
        this.planoGerado = false;
        this.form.reset();
        this.initializeForm();
        this.setupFormWatchers();
    }

    getCorCard(totalCalorias: number): string {
        if (totalCalorias < 1500) return 'border-l-4 border-yellow-400';
        if (totalCalorias < 2500) return 'border-l-4 border-green-400';
        return 'border-l-4 border-red-400';
    }

    getCorBadge(totalCalorias: number): string {
        if (totalCalorias < 1500) return 'bg-yellow-100 text-yellow-800';
        if (totalCalorias < 2500) return 'bg-green-100 text-green-800';
        return 'bg-red-100 text-red-800';
    }

    getTotalCaloriasSemana(): number {
        return this.diasPlano.reduce((total, dia) => total + dia.totalCalorias, 0);
    }

    carregarPlanosSalvos(): void {
        this._refeicoesService.listarPlanos()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (planos) => {
                    this.planosSalvos = planos;
                },
                error: (error) => {
                    console.error('Erro ao carregar planos salvos:', error);
                }
            });
    }

    visualizarPlanoSalvo(plano: PlanoAlimentarDetalhado): void {
        this.planoSelecionado = plano;
        this.modoVisualizacao = 'visualizar';

        this.converterPlanoSalvoParaVisualizacao(plano);
    }

    private converterPlanoSalvoParaVisualizacao(plano: PlanoAlimentarDetalhado): void {
        const planoOrganizado: { [refeicao: string]: { [dia: string]: AlimentoResponse[] } } = {};

        plano.refeicoes.forEach(refeicao => {
            const partesNome = refeicao.nome.split(' - ');
            if (partesNome.length === 2) {
                const tipoRefeicao = partesNome[0];
                const dia = partesNome[1];

                if (!planoOrganizado[tipoRefeicao]) {
                    planoOrganizado[tipoRefeicao] = {};
                }

                planoOrganizado[tipoRefeicao][dia] = refeicao.alimentos;
            }
        });

        this.planoSemanal = planoOrganizado;
        this.organizarPlanoSemanal();
        this.planoGerado = true;
    }

    voltarParaListaPlanos(): void {
        this.planoSelecionado = null;
        this.modoVisualizacao = 'gerar';
        this.diasPlano = [];
        this.planoSemanal = null;
        this.planoGerado = false;
    }

    excluirPlanoSalvo(planoId: number): void {
        const dialogRef = this._fuseConfirmationService.open({
            title: 'Excluir Plano Salvo',
            message: 'Deseja excluir este plano salvo? As refeições aceitas continuarão no seu planejamento.',
            actions: {
                confirm: {
                    label: 'Excluir',
                    color: 'warn'
                },
                cancel: {
                    label: 'Cancelar'
                }
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._refeicoesService.excluirPlano(planoId)
                    .pipe(takeUntilDestroyed(this._destroyRef))
                    .subscribe({
                        next: () => {
                            this._snackBar.open('Plano excluído com sucesso!', 'Fechar', { duration: 3000 });
                            this.carregarPlanosSalvos();
                            if (this.planoSelecionado?.id === planoId) {
                                this.voltarParaListaPlanos();
                            }
                        },
                        error: (error) => {
                            console.error('Erro ao excluir plano:', error);
                            this._snackBar.open('Erro ao excluir plano', 'Fechar', { duration: 3000 });
                        }
                    });
            }
        });
    }

    private carregarAlimentosDisponiveis(): void {

    }
}
