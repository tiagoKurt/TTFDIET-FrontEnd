import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RefeicoesService } from '../../refeicoes/refeicoes.service';
import { RefeicaoResponse, AlimentoResponse } from '../../refeicoes/refeicoes.types';
import { PlanoAlimentarAceitarComponent } from '../plano-alimentar-aceitar/plano-alimentar-aceitar.component';

interface DiaComRefeicoes {
    data: Date;
    dataString: string;
    refeicoes: RefeicaoResponse[];
    totalCalorias: number;
    totalProteinas: number;
    totalCarboidratos: number;
    totalGorduras: number;
    expandido: boolean;
}

interface PeriodoFiltro {
    label: string;
    dias: number;
    valor: string;
}

@Component({
    selector: 'app-planejamento-diario',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule,
        MatChipsModule,
        MatProgressBarModule,
        MatMenuModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatExpansionModule,
        MatSelectModule,
        MatTabsModule,
        ReactiveFormsModule,
        RouterModule,
        PlanoAlimentarAceitarComponent
    ],
    templateUrl: './planejamento-diario.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PlanejamentoDiarioComponent implements OnInit {
    periodoSelecionado = new FormControl('1mes');
    diasComRefeicoes: DiaComRefeicoes[] = [];
    carregando = false;
    abaSelecionada = 0;

    periodosFiltro: PeriodoFiltro[] = [
        { label: '1 mês', dias: 30, valor: '1mes' },
        { label: '2 meses', dias: 60, valor: '2meses' },
        { label: '3 meses', dias: 90, valor: '3meses' },
        { label: 'Todos os períodos', dias: 365, valor: 'todos' }
    ];

    constructor(
        private refeicoesService: RefeicoesService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.periodoSelecionado.setValue('1mes');
        this.periodoSelecionado.valueChanges.subscribe(() => {
            if (this.abaSelecionada === 0) {
                this.buscarRefeicoesDoPeriodo();
            }
        });
        this.buscarRefeicoesDoPeriodo();
    }

    onTabChange(index: number): void {
        this.abaSelecionada = index;
        if (index === 0) {
            this.buscarRefeicoesDoPeriodo();
        }
    }

    obterPeriodoPorFiltro(filtro: string): { inicio: Date; fim: Date } {
        const hoje = new Date();
        const inicio = new Date(hoje);
        const fim = new Date(hoje);

        fim.setHours(23, 59, 59, 999);

        switch (filtro) {
            case '1mes':
                fim.setMonth(fim.getMonth() + 1);
                fim.setDate(0);
                break;
            case '2meses':
                fim.setMonth(fim.getMonth() + 2);
                fim.setDate(0);
                break;
            case '3meses':
                fim.setMonth(fim.getMonth() + 3);
                fim.setDate(0);
                break;
            case 'todos':
                fim.setFullYear(fim.getFullYear() + 1);
                break;
            default:
                fim.setMonth(fim.getMonth() + 1);
                fim.setDate(0);
        }

        inicio.setHours(0, 0, 0, 0);

        return { inicio, fim };
    }

    buscarRefeicoesDoPeriodo(): void {
        const filtro = this.periodoSelecionado.value || '1mes';
        const periodo = this.obterPeriodoPorFiltro(filtro);

        this.carregando = true;

        const inicioISO = this.formatarDataParaAPI(periodo.inicio);
        const fimISO = this.formatarDataParaAPI(periodo.fim);

        console.log('Buscando refeições do período:', { inicioISO, fimISO });

        this.refeicoesService.buscarRefeicoesPorData(inicioISO, fimISO).subscribe({
            next: (refeicoes) => {
                console.log('Refeições recebidas:', refeicoes);
                this.organizarRefeicoesPorDia(refeicoes);
                this.carregando = false;
            },
            error: (error) => {
                console.error('Erro ao buscar refeições do período:', error);
                this.snackBar.open('Erro ao carregar refeições do período', 'Fechar', { duration: 3000 });
                this.carregando = false;
            }
        });
    }

    formatarDataParaAPI(data: Date): string {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        const hora = String(data.getHours()).padStart(2, '0');
        const minuto = String(data.getMinutes()).padStart(2, '0');
        const segundo = String(data.getSeconds()).padStart(2, '0');

        return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
    }

    organizarRefeicoesPorDia(refeicoes: RefeicaoResponse[]): void {
        const refeicoesAgrupadasPorDia = new Map<string, RefeicaoResponse[]>();

        // Filtrar apenas refeições com status ACEITA
        const refeicoesAceitas = refeicoes.filter(refeicao =>
            refeicao.status === 'ACEITA'
        );

        refeicoesAceitas.forEach(refeicao => {
            const dataRefeicao = new Date(refeicao.dataHoraRefeicao);
            const dataString = dataRefeicao.toISOString().split('T')[0];

            if (!refeicoesAgrupadasPorDia.has(dataString)) {
                refeicoesAgrupadasPorDia.set(dataString, []);
            }
            refeicoesAgrupadasPorDia.get(dataString)!.push(refeicao);
        });

        this.diasComRefeicoes = [];
        refeicoesAgrupadasPorDia.forEach((refeicoesData, dataString) => {
            const data = new Date(dataString + 'T00:00:00');

            const totalCalorias = refeicoesData.reduce((total, refeicao) => {
                return total + refeicao.alimentos.reduce((subtotal, alimento) =>
                    subtotal + alimento.calorias, 0);
            }, 0);

            const totalProteinas = refeicoesData.reduce((total, refeicao) => {
                return total + refeicao.alimentos.reduce((subtotal, alimento) =>
                    subtotal + alimento.proteinas, 0);
            }, 0);

            const totalCarboidratos = refeicoesData.reduce((total, refeicao) => {
                return total + refeicao.alimentos.reduce((subtotal, alimento) =>
                    subtotal + alimento.carboidratos, 0);
            }, 0);

            const totalGorduras = refeicoesData.reduce((total, refeicao) => {
                return total + refeicao.alimentos.reduce((subtotal, alimento) =>
                    subtotal + alimento.gordura, 0);
            }, 0);

            this.diasComRefeicoes.push({
                data,
                dataString,
                refeicoes: refeicoesData.sort((a, b) =>
                    new Date(a.dataHoraRefeicao).getTime() - new Date(b.dataHoraRefeicao).getTime()
                ),
                totalCalorias,
                totalProteinas,
                totalCarboidratos,
                totalGorduras,
                expandido: false
            });
        });

        this.diasComRefeicoes.sort((a, b) => b.data.getTime() - a.data.getTime());
    }

    toggleCardExpansao(dia: DiaComRefeicoes): void {
        dia.expandido = !dia.expandido;
    }

    formatarData(data: Date): string {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatarDiaSemana(data: Date): string {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long'
        });
    }

    formatarHoraRefeicao(data: string): string {
        return new Date(data).toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    obterPeriodoRefeicao(hora: string): string {
        const horaNum = parseInt(hora.split(':')[0]);
        if (horaNum >= 5 && horaNum < 12) return 'Manhã';
        if (horaNum >= 12 && horaNum < 18) return 'Tarde';
        if (horaNum >= 18 && horaNum < 22) return 'Noite';
        return 'Madrugada';
    }

    agruparRefeicoesPorPeriodo(refeicoes: RefeicaoResponse[]): { periodo: string; refeicoes: RefeicaoResponse[] }[] {
        const grupos = new Map<string, RefeicaoResponse[]>();

        refeicoes.forEach(refeicao => {
            const hora = this.formatarHoraRefeicao(refeicao.dataHoraRefeicao);
            const periodo = this.obterPeriodoRefeicao(hora);

            if (!grupos.has(periodo)) {
                grupos.set(periodo, []);
            }
            grupos.get(periodo)!.push(refeicao);
        });

        const periodosOrdem = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
        const resultado: { periodo: string; refeicoes: RefeicaoResponse[] }[] = [];

        periodosOrdem.forEach(periodo => {
            if (grupos.has(periodo)) {
                resultado.push({
                    periodo,
                    refeicoes: grupos.get(periodo)!
                });
            }
        });

        return resultado;
    }

    excluirAlimento(refeicaoId: number, alimentoId: number): void {
        if (confirm('Tem certeza que deseja excluir este alimento da refeição?')) {
            this.refeicoesService.excluirAlimentoMinhasRefeicoes(refeicaoId, alimentoId).subscribe({
                next: () => {
                    this.snackBar.open('Alimento excluído com sucesso!', 'Fechar', { duration: 3000 });
                    this.buscarRefeicoesDoPeriodo();
                },
                error: (error) => {
                    console.error('Erro ao excluir alimento:', error);
                    this.snackBar.open('Erro ao excluir alimento', 'Fechar', { duration: 3000 });
                }
            });
        }
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

    calcularTotalCaloriasPeriodo(): number {
        return this.diasComRefeicoes.reduce((total, dia) => total + dia.totalCalorias, 0);
    }

    obterIconePeriodo(periodo: string): string {
        switch (periodo) {
            case 'Manhã':
                return 'wb_sunny';
            case 'Tarde':
                return 'light_mode';
            case 'Noite':
                return 'dark_mode';
            case 'Madrugada':
                return 'bedtime';
            default:
                return 'schedule';
        }
    }

    obterIconePeriodoFiltro(valor: string): string {
        switch (valor) {
            case '1mes':
                return 'calendar_view_month';
            case '2meses':
                return 'date_range';
            case '3meses':
                return 'event_note';
            case 'todos':
                return 'all_inclusive';
            default:
                return 'calendar_today';
        }
    }



    obterCorPeriodo(periodo: string): string {
        switch (periodo) {
            case 'Manhã': return 'text-yellow-500';
            case 'Tarde': return 'text-orange-500';
            case 'Noite': return 'text-purple-500';
            case 'Madrugada': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    }

    obterIconeRefeicao(nomeRefeicao: string): string {
        const nome = nomeRefeicao.toLowerCase();
        if (nome.includes('café') || nome.includes('manhã')) return 'free_breakfast';
        if (nome.includes('almoço')) return 'lunch_dining';
        if (nome.includes('lanche') && nome.includes('tarde')) return 'local_cafe';
        if (nome.includes('jantar')) return 'dinner_dining';
        if (nome.includes('lanche') && nome.includes('noite')) return 'nightlight';
        return 'restaurant';
    }

    obterCorRefeicao(nomeRefeicao: string): string {
        const nome = nomeRefeicao.toLowerCase();
        if (nome.includes('café') || nome.includes('manhã')) return 'text-amber-500';
        if (nome.includes('almoço')) return 'text-green-500';
        if (nome.includes('lanche') && nome.includes('tarde')) return 'text-orange-500';
        if (nome.includes('jantar')) return 'text-blue-500';
        if (nome.includes('lanche') && nome.includes('noite')) return 'text-purple-500';
        return 'text-gray-500';
    }
}
