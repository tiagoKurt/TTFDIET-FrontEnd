import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { RefeicoesService } from '../../refeicoes/refeicoes.service';
import { PlanoAlimentarDetalhado, RefeicaoResponse, AlimentoResponse } from '../../refeicoes/refeicoes.types';

interface RefeicaoComPlano extends RefeicaoResponse {
    planoId: number;
    diaSemana: string;
    dataFormatada: string;
}

interface DiaComRefeicoes {
    dia: string;
    dataCompleta: Date;
    refeicoes: RefeicaoComPlano[];
    totalCalorias: number;
    totalProteinas: number;
    totalCarboidratos: number;
    totalGorduras: number;
    expandido: boolean;
}

@Component({
    selector: 'app-planejamento-semanal',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatDividerModule,
        MatChipsModule,
        MatProgressBarModule,
        MatMenuModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatExpansionModule
    ],
    templateUrl: './planejamento-semanal.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PlanejamentoSemanalComponent implements OnInit {
    planosSalvos: PlanoAlimentarDetalhado[] = [];
    diasComRefeicoes: DiaComRefeicoes[] = [];
    carregando = false;
    diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    constructor(
        private refeicoesService: RefeicoesService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.carregarPlanosSalvos();
    }

    carregarPlanosSalvos(): void {
        this.carregando = true;

        this.refeicoesService.listarPlanos().subscribe({
            next: (planos) => {
                console.log('Planos salvos carregados:', planos);
                this.planosSalvos = planos;
                this.organizarRefeicoesPorDia();
                this.carregando = false;
            },
            error: (error) => {
                console.error('Erro ao carregar planos salvos:', error);
                this.snackBar.open('Erro ao carregar planos alimentares', 'Fechar', { duration: 3000 });
                this.carregando = false;
            }
        });
    }

    organizarRefeicoesPorDia(): void {
        const diasMap = new Map<string, DiaComRefeicoes>();

        this.diasSemana.forEach((dia, index) => {
            const dataCompleta = this.getDataProximoDia(index + 1); // 1 = segunda, 7 = domingo
            diasMap.set(dia, {
                dia,
                dataCompleta,
                refeicoes: [],
                totalCalorias: 0,
                totalProteinas: 0,
                totalCarboidratos: 0,
                totalGorduras: 0,
                expandido: false
            });
        });

        this.planosSalvos.forEach(plano => {
            plano.refeicoes.forEach((refeicao, index) => {
                const diaSemana = this.diasSemana[index % this.diasSemana.length];
                const diaData = diasMap.get(diaSemana);

                if (diaData) {
                    const refeicaoComPlano: RefeicaoComPlano = {
                        ...refeicao,
                        planoId: plano.id,
                        diaSemana,
                        dataFormatada: this.formatarData(diaData.dataCompleta)
                    };

                    diaData.refeicoes.push(refeicaoComPlano);

                    const caloriasRefeicao = refeicao.alimentos.reduce((total, alimento) => total + alimento.calorias, 0);
                    const proteinasRefeicao = refeicao.alimentos.reduce((total, alimento) => total + alimento.proteinas, 0);
                    const carboidratosRefeicao = refeicao.alimentos.reduce((total, alimento) => total + alimento.carboidratos, 0);
                    const gordurasRefeicao = refeicao.alimentos.reduce((total, alimento) => total + alimento.gordura, 0);

                    diaData.totalCalorias += caloriasRefeicao;
                    diaData.totalProteinas += proteinasRefeicao;
                    diaData.totalCarboidratos += carboidratosRefeicao;
                    diaData.totalGorduras += gordurasRefeicao;
                }
            });
        });

        this.diasComRefeicoes = Array.from(diasMap.values()).filter(dia => dia.refeicoes.length > 0);
    }

    getDataProximoDia(diaSemana: number): Date {
        const hoje = new Date();
        const diaAtual = hoje.getDay();

        const diaAtualAjustado = diaAtual === 0 ? 7 : diaAtual;
        const diasParaProximo = (diaSemana - diaAtualAjustado + 7) % 7;

        const proximaData = new Date(hoje);
        proximaData.setDate(hoje.getDate() + diasParaProximo);

        return proximaData;
    }

    toggleDiaExpansao(dia: DiaComRefeicoes): void {
        dia.expandido = !dia.expandido;
    }

    formatarData(data: Date): string {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatarHoraRefeicao(data: string): string {
        const dataObj = new Date(data);
        return dataObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    obterPeriodoRefeicao(nome: string): string {
        const periodo = nome.toLowerCase();
        if (periodo.includes('café') || periodo.includes('manhã')) return 'Café da Manhã';
        if (periodo.includes('almoço')) return 'Almoço';
        if (periodo.includes('lanche') && periodo.includes('tarde')) return 'Lanche da Tarde';
        if (periodo.includes('jantar')) return 'Jantar';
        if (periodo.includes('lanche') && periodo.includes('noite')) return 'Lanche da Noite';
        return 'Refeição';
    }

    aceitarRefeicao(refeicao: RefeicaoComPlano): void {
        const hoje = new Date();
        const periodoRefeicao = this.obterPeriodoRefeicao(refeicao.nome);

        const horariosRefeicao = {
            'Café da Manhã': { hora: 7, minuto: 0 },
            'Almoço': { hora: 12, minuto: 0 },
            'Lanche da Tarde': { hora: 15, minuto: 0 },
            'Jantar': { hora: 19, minuto: 0 },
            'Lanche da Noite': { hora: 21, minuto: 0 },
            'Refeição': { hora: 12, minuto: 0 }
        };

        const horario = horariosRefeicao[periodoRefeicao] || horariosRefeicao['Refeição'];
        hoje.setHours(horario.hora, horario.minuto, 0, 0);

        const novaRefeicao = {
            nome: `${periodoRefeicao} - ${refeicao.nome}`,
            observacao: `Refeição aceita do plano alimentar - ${refeicao.observacao || ''}`,
            dataHoraRefeicao: hoje.toISOString(),
            alimentos: refeicao.alimentos.map(alimento => ({
                nome: alimento.nome,
                quantidade: alimento.quantidade,
                calorias: alimento.calorias,
                proteinas: alimento.proteinas,
                carboidratos: alimento.carboidratos,
                gordura: alimento.gordura,
                unidade_medida: alimento.unidade_medida,
                mensagem: alimento.mensagem
            }))
        };

        this.refeicoesService.adicionarRefeicao(novaRefeicao).subscribe({
            next: (refeicaoSalva) => {
                                this.snackBar.open(
                    `Refeição "${periodoRefeicao}" adicionada ao planejamento diário!`,
                    'Ver Planejamento',
                    {
                        duration: 5000
                    }
                );
                console.log('Refeição aceita e salva:', refeicaoSalva);
            },
            error: (error) => {
                console.error('Erro ao aceitar refeição:', error);
                this.snackBar.open('Erro ao aceitar refeição', 'Fechar', { duration: 3000 });
            }
        });
    }

    agruparRefeicoesPorPeriodo(refeicoes: RefeicaoComPlano[]): { periodo: string; refeicoes: RefeicaoComPlano[] }[] {
        const grupos = refeicoes.reduce((acc, refeicao) => {
            const periodo = this.obterPeriodoRefeicao(refeicao.nome);
            if (!acc[periodo]) {
                acc[periodo] = [];
            }
            acc[periodo].push(refeicao);
            return acc;
        }, {} as { [key: string]: RefeicaoComPlano[] });

        return Object.entries(grupos).map(([periodo, refeicoes]) => ({
            periodo,
            refeicoes
        }));
    }

    calcularTotalCalorias(): number {
        return this.diasComRefeicoes.reduce((total, dia) => total + dia.totalCalorias, 0);
    }

    calcularTotalProteinas(): number {
        return this.diasComRefeicoes.reduce((total, dia) => total + dia.totalProteinas, 0);
    }

    calcularTotalCarboidratos(): number {
        return this.diasComRefeicoes.reduce((total, dia) => total + dia.totalCarboidratos, 0);
    }

    calcularTotalGorduras(): number {
        return this.diasComRefeicoes.reduce((total, dia) => total + dia.totalGorduras, 0);
    }

    getCorCardDia(totalCalorias: number): string {
        if (totalCalorias < 1500) return 'border-l-4 border-yellow-400';
        if (totalCalorias <= 2500) return 'border-l-4 border-green-400';
        return 'border-l-4 border-red-400';
    }

    getCorBadgeDia(totalCalorias: number): string {
        if (totalCalorias < 1500) return 'bg-yellow-100 text-yellow-800';
        if (totalCalorias <= 2500) return 'bg-green-100 text-green-800';
        return 'bg-red-100 text-red-800';
    }

    calcularTotalCaloriasRefeicao(refeicao: RefeicaoComPlano): number {
        return refeicao.alimentos.reduce((total, alimento) => total + alimento.calorias, 0);
    }

    calcularTotalProteinasRefeicao(refeicao: RefeicaoComPlano): number {
        return refeicao.alimentos.reduce((total, alimento) => total + alimento.proteinas, 0);
    }

    calcularTotalCarboidratosRefeicao(refeicao: RefeicaoComPlano): number {
        return refeicao.alimentos.reduce((total, alimento) => total + alimento.carboidratos, 0);
    }

    calcularTotalGordurasRefeicao(refeicao: RefeicaoComPlano): number {
        return refeicao.alimentos.reduce((total, alimento) => total + alimento.gordura, 0);
    }
}