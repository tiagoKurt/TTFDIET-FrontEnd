import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { MetasService, MetaRequest } from '../metas.service';
import { Meta } from '../metas.component';

export interface ModalMetaData {
    meta?: Meta;
    modo: 'criar' | 'editar' | 'progresso';
}

@Component({
    selector: 'app-modal-meta',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatSliderModule,
        MatStepperModule
    ],
    templateUrl: './modal-meta.component.html',
    styleUrls: ['./modal-meta.component.scss']
})
export class ModalMetaComponent implements OnInit {
    metaForm: FormGroup;
    progressoForm: FormGroup;
    isLoading = false;

    tiposMeta = [
        { valor: 'PESO', label: 'Peso Corporal', icone: 'scale', cor: 'text-blue-500', unidade: 'kg' },
        { valor: 'AGUA', label: 'Hidratação Diária', icone: 'water_drop', cor: 'text-cyan-500', unidade: 'ml' },
        { valor: 'CALORIAS', label: 'Consumo Calórico', icone: 'local_fire_department', cor: 'text-orange-500', unidade: 'kcal' }
    ];

    constructor(
        private fb: FormBuilder,
        private metasService: MetasService,
        public dialogRef: MatDialogRef<ModalMetaComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ModalMetaData
    ) {
        this.metaForm = this.fb.group({
            tipoMeta: [this.data.meta?.tipoMeta || '', Validators.required],
            valorMeta: [this.data.meta?.valorMeta || null, [Validators.required, Validators.min(0.1)]],
            valorAtual: [this.data.meta?.valorAtual || null]
        });

        this.progressoForm = this.fb.group({
            valorAtual: [this.data.meta?.valorAtual || null, [Validators.required, Validators.min(0)]]
        });
    }

    ngOnInit(): void {
        if (this.data.modo === 'editar' && this.data.meta) {
            this.metaForm.patchValue({
                tipoMeta: this.data.meta.tipoMeta,
                valorMeta: this.data.meta.valorMeta,
                valorAtual: this.data.meta.valorAtual
            });
        } else if (this.data.modo === 'criar' && this.data.meta?.tipoMeta) {
            this.metaForm.patchValue({
                tipoMeta: this.data.meta.tipoMeta
            });
        }
    }

    get tituloModal(): string {
        switch (this.data.modo) {
            case 'criar': return 'Nova Meta';
            case 'editar': return 'Editar Meta';
            case 'progresso': return 'Atualizar Progresso';
            default: return 'Meta';
        }
    }

    get tipoSelecionado() {
        const tipo = this.metaForm.get('tipoMeta')?.value;
        return this.tiposMeta.find(t => t.valor === tipo);
    }

    obterDescricaoTipo(tipo: string): string {
        const descricoes = {
            'PESO': 'Defina seu peso ideal e acompanhe seu progresso rumo ao objetivo.',
            'AGUA': 'Estabeleça uma meta diária de hidratação para manter sua saúde em dia.',
            'CALORIAS': 'Controle seu consumo calórico diário de acordo com seus objetivos.'
        };
        return descricoes[tipo] || '';
    }

    obterSugestaoValor(tipo: string): string {
        const sugestoes = {
            'PESO': 'Ex: 70kg para peso ideal',
            'AGUA': 'Ex: 2500ml (recomendado: 35ml × seu peso)',
            'CALORIAS': 'Ex: 2000kcal (baseado no seu gasto energético)'
        };
        return sugestoes[tipo] || '';
    }

    calcularSugestaoAgua(): number {
        const pesoUsuario = 70;
        return pesoUsuario * 35;
    }

    usarSugestaoAgua(): void {
        const sugestao = this.calcularSugestaoAgua();
        this.metaForm.patchValue({ valorMeta: sugestao });
    }

    onTipoChange(): void {
        this.metaForm.patchValue({
            valorMeta: null,
            valorAtual: null
        });
    }

    salvar(): void {
        if (this.data.modo === 'progresso') {
            this.atualizarProgresso();
            return;
        }

        if (this.metaForm.invalid) {
            this.metaForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const metaRequest: MetaRequest = this.metaForm.value;

        const operacao = this.data.modo === 'criar'
            ? this.metasService.criarMeta(metaRequest)
            : this.metasService.atualizarMeta(this.data.meta!.id!, metaRequest);

        operacao.subscribe({
            next: (meta) => {
                this.dialogRef.close({ success: true, meta, modo: this.data.modo });
            },
            error: (error) => {
                console.error('Erro ao salvar meta:', error);
                this.isLoading = false;
            }
        });
    }

    atualizarProgresso(): void {
        if (this.progressoForm.invalid) {
            this.progressoForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const novoValor = this.progressoForm.get('valorAtual')?.value;

        this.metasService.atualizarProgresso(this.data.meta!.id!, novoValor).subscribe({
            next: (meta) => {
                this.isLoading = false;
                this.dialogRef.close({ success: true, meta, modo: this.data.modo });
            },
            error: (error) => {
                console.error('Erro ao atualizar progresso:', error);
                this.isLoading = false;
                this.dialogRef.close({ success: false, error: error.message || 'Erro ao atualizar progresso' });
            }
        });
    }

    cancelar(): void {
        this.dialogRef.close({ success: false });
    }

    obterErroField(fieldName: string, formGroup: FormGroup = this.metaForm): string {
        const field = formGroup.get(fieldName);
        if (!field || !field.errors || !field.touched) return '';

        if (field.errors['required']) return 'Este campo é obrigatório';
        if (field.errors['min']) return `Valor deve ser maior que ${field.errors['min'].min}`;
        return 'Campo inválido';
    }

    obterIconePorTipo(tipo: string): string {
        const icones = {
            'PESO': 'scale',
            'AGUA': 'water_drop',
            'CALORIAS': 'local_fire_department'
        };
        return icones[tipo] || 'flag';
    }

    obterLabelPorTipo(tipo: string): string {
        const labels = {
            'PESO': 'Peso Corporal',
            'AGUA': 'Hidratação Diária',
            'CALORIAS': 'Consumo Calórico'
        };
        return labels[tipo] || tipo;
    }

    obterUnidadePorTipo(tipo: string): string {
        const unidades = {
            'PESO': 'kg',
            'AGUA': 'ml',
            'CALORIAS': 'kcal'
        };
        return unidades[tipo] || '';
    }
}
