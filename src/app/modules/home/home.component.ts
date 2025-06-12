import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
// import { CadastrarMetaDialogComponent } from './cadastrar-meta-dialog/cadastrar-meta-dialog.component';

interface RefeicaoSugerida {
    nome: string;
    quantidade: string;
}

interface RecomendacaoNutricional {
    tipo: 'alerta' | 'positivo' | 'dica';
    titulo: string;
    descricao: string;
    icone: string;
    corIcone: string;
}
interface ProgressoPeso {
    pesoAtual: number;
    pesoMeta?: number;
    diferenca?: number;
    porcentagemProgresso?: number;
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
        MatButtonModule,
    ],
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
    // Dados mockados para o resumo diário
    caloriasTotais: number = 2000;
    caloriasConsumidas: number = 1450;
    porcentagemCalorias: number = 0;

    // Macronutrientes
    macronutrientes = [
        {
            nome: 'Carboidratos',
            valor: 45,
            cor: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            nome: 'Proteínas',
            valor: 30,
            cor: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            nome: 'Gorduras',
            valor: 25,
            cor: 'text-amber-600',
            bg: 'bg-amber-50',
        },
    ];

    // Dados mockados para próxima refeição
    proximaRefeicao = {
        nome: 'Almoço',
        horario: '12:30h',
        itens: [
            { nome: 'Filé de frango grelhado', quantidade: '150g' },
            { nome: 'Arroz integral', quantidade: '100g' },
            { nome: 'Salada de folhas verdes', quantidade: 'à vontade' },
            { nome: '1 fruta para sobremesa', quantidade: '' },
        ],
    };

    // Dados mockados para progresso
    progresso: ProgressoPeso;

    // Dados mockados para planejamento semanal
    diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasDoMes = [10, 11, 12, 13, 14, 15, 16];
    diasComRefeicao = [12, 14]; // dias com refeições planejadas

    // Dados mockados para recomendações
    recomendacoes: RecomendacaoNutricional[] = [
        {
            tipo: 'alerta',
            titulo: 'Atenção ao consumo de água',
            descricao:
                'Você está consumindo menos água que o recomendado. Tente aumentar para pelo menos 2L por dia.',
            icone: 'heroicons_solid:exclamation-circle',
            corIcone: 'text-purple-500',
        },
        {
            tipo: 'positivo',
            titulo: 'Excelente consumo de proteínas',
            descricao:
                'Você mantém um consumo ideal de proteínas para seus objetivos. Continue assim!',
            icone: 'heroicons_solid:thumb-up',
            corIcone: 'text-green-500',
        },
        {
            tipo: 'dica',
            titulo: 'Dica nutricional',
            descricao:
                'Considere adicionar mais alimentos ricos em ferro à sua dieta, como folhas verde-escuras e leguminosas.',
            icone: 'heroicons_solid:star',
            corIcone: 'text-amber-500',
        },
    ];

    constructor(
        private router: Router,
        private _userService: UserService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.porcentagemCalorias =
            (this.caloriasConsumidas / this.caloriasTotais) * 100;
        this._userService.getProfile().subscribe({
            next: (user) => {
                this.progresso = {
                    pesoAtual: user.peso,
                };
            },
        });
    }

    verificarRefeicaoPlanejada(dia: number): boolean {
        return this.diasComRefeicao.includes(dia);
    }

    navegarParaPlanejamentoSemanal(): void {}

    registrarRefeicao(): void {}

    // abrirModal() {
    //     this.dialog.open(CadastrarMetaDialogComponent, {
    //         width: '400px',
    //     });
    // }
}
