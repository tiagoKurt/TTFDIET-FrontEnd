import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';import { MatFormFieldModule } from '@angular/material/form-field';import { MatInputModule } from '@angular/material/input';import { MatSelectModule } from '@angular/material/select';import { MatRadioModule } from '@angular/material/radio';import { MatChipsModule } from '@angular/material/chips';import { MatCheckboxModule } from '@angular/material/checkbox';import { MatIconModule } from '@angular/material/icon';import { MatDividerModule } from '@angular/material/divider';import { MatTabsModule } from '@angular/material/tabs';import { MatCardModule } from '@angular/material/card';import { MatTooltipModule } from '@angular/material/tooltip';
import { fuseAnimations } from '@fuse/animations';

export enum ObjetivoEnum {
  PERDER_PESO = 'PERDER_PESO',
  MANTER_PESO = 'MANTER_PESO',
  GANHAR_MASSA = 'GANHAR_MASSA'
}

export enum NivelAtividadeEnum {
  SEDENTARIO = 'SEDENTARIO',
  LEVE = 'LEVE',
  MODERADO = 'MODERADO',
  INTENSO = 'INTENSO',
  ATLETA = 'ATLETA'
}

export interface Comorbidade {
  id: string;
  nome: string;
  descricao: string;
}

export interface AlergiaAlimentar {
  id: string;
  nome: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatChipsModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './profile.component.html',
  animations: fuseAnimations
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  editMode = false;

  objetivos = Object.values(ObjetivoEnum);
  niveisAtividade = Object.values(NivelAtividadeEnum);

  userData = {
    nome: 'Hughes Brian',
    email: 'hughes.brian@company.com',
    altura: 175,
    peso: 70.5,
    idade: 35,
    sexo: 'masculino',
    nivelAtividade: 'MODERADO',
    objetivo: 'MANTER_PESO',
    semAlergias: false,
    semComorbidades: false
  };

  alergiasAlimentares: AlergiaAlimentar[] = [
    { id: 'leite', nome: 'Leite e derivados' },
    { id: 'ovo', nome: 'Ovos' },
    { id: 'amendoim', nome: 'Amendoim' },
    { id: 'nozes', nome: 'Nozes e castanhas' },
    { id: 'soja', nome: 'Soja' },
    { id: 'trigo', nome: 'Trigo (Glúten)' },
    { id: 'mariscos', nome: 'Mariscos e frutos do mar' },
    { id: 'peixes', nome: 'Peixes' },
    { id: 'morango', nome: 'Morango' },
    { id: 'kiwi', nome: 'Kiwi' },
    { id: 'tomate', nome: 'Tomate' },
    { id: 'milho', nome: 'Milho' },
    { id: 'chocolate', nome: 'Chocolate' },
    { id: 'citricos', nome: 'Cítricos (laranja, limão)' },
    { id: 'abacaxi', nome: 'Abacaxi' },
    { id: 'pimenta', nome: 'Pimenta' },
    { id: 'carne_porco', nome: 'Carne de porco' },
    { id: 'mel', nome: 'Mel' }
  ];

  comorbidades: Comorbidade[] = [
    { id: 'diabetes', nome: 'Diabetes Mellitus (Tipo 1 e 2)', descricao: 'Redução de açúcares simples, controle de carboidratos.' },
    { id: 'hipertensao', nome: 'Hipertensão Arterial', descricao: 'Redução de sódio, evitar alimentos industrializados e ultraprocessados.' },
    { id: 'dislipidemia', nome: 'Dislipidemia (colesterol alto/triglicerídeos)', descricao: 'Redução de gorduras saturadas/trans, aumento de fibras.' },
    { id: 'obesidade', nome: 'Obesidade', descricao: 'Controle calórico, incentivo a dietas equilibradas e ricas em nutrientes.' },
    { id: 'doenca_celiaca', nome: 'Doença Celíaca', descricao: 'Eliminação total do glúten (trigo, centeio, cevada e derivados).' },
    { id: 'intolerancia_lactose', nome: 'Intolerância à Lactose', descricao: 'Restrição de produtos com lactose ou uso de alternativas sem lactose.' },
    { id: 'doenca_renal', nome: 'Doença Renal Crônica', descricao: 'Controle de proteínas, potássio, fósforo e sódio.' },
    { id: 'gastrite_ulcera', nome: 'Gastrite/Úlcera', descricao: 'Evitar alimentos ácidos, gordurosos, cafeína e álcool.' },
    { id: 'sii', nome: 'Síndrome do Intestino Irritável (SII)', descricao: 'Dieta FODMAP (redução de certos carboidratos fermentáveis).' },
    { id: 'anemia', nome: 'Anemia Ferropriva', descricao: 'Aumento de alimentos ricos em ferro e vitamina C, evitar consumo de café junto às refeições.' },
    { id: 'tireoide', nome: 'Hipotireoidismo/Hipertireoidismo', descricao: 'Ajustes no consumo de iodo, selênio e alimentos que interferem na tireoide.' },
    { id: 'gota', nome: 'Gota (ácido úrico elevado)', descricao: 'Redução de carnes vermelhas, vísceras, frutos do mar e bebidas alcoólicas.' },
    { id: 'esteatose', nome: 'Esteatose Hepática (fígado gorduroso)', descricao: 'Redução de açúcares simples e gorduras, aumento de vegetais e cereais integrais.' },
    { id: 'crohn_retocolite', nome: 'Doença de Crohn / Retocolite Ulcerativa', descricao: 'Dietas específicas conforme fase da doença (evitar fibras insolúveis em crises).' }
  ];

  alergiasAlimentaresSelecionadas: AlergiaAlimentar[] = [
    { id: 'leite', nome: 'Leite e derivados' },
    { id: 'amendoim', nome: 'Amendoim' }
  ];

  comorbidadesSelecionadas: Comorbidade[] = [
    { id: 'intolerancia_lactose', nome: 'Intolerância à Lactose', descricao: 'Restrição de produtos com lactose ou uso de alternativas sem lactose.' }
  ];

  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.fillFormWithUserData();
    this.disableForm();
  }

  initForm(): void {
    this.profileForm = this._formBuilder.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      altura: ['', [
        Validators.required,
        Validators.min(50),
        Validators.max(260),
        Validators.pattern('^[0-9]*$')
      ]],
      peso: ['', [
        Validators.required,
        Validators.min(10),
        Validators.max(360),
        Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')
      ]],
      idade: ['', [
        Validators.required,
        Validators.min(4),
        Validators.max(120),
        Validators.pattern('^[0-9]*$')
      ]],
      sexo: ['', [Validators.required]],
      nivelAtividade: ['', [Validators.required]],
      objetivo: ['', [Validators.required]],
      semAlergias: [false],
      alergiasAlimentares: this._formBuilder.array([]),
      semComorbidades: [false],
      comorbidades: this._formBuilder.array([])
    });

    this.profileForm.get('semAlergias').valueChanges.subscribe(valor => {
      if (valor) {
        this.alergiasAlimentaresSelecionadas = [];
        this.alergiasFormArray.clear();
      }
    });

    this.profileForm.get('semComorbidades').valueChanges.subscribe(valor => {
      if (valor) {
        this.comorbidadesSelecionadas = [];
        this.comorbidadesFormArray.clear();
      }
    });
  }

  fillFormWithUserData(): void {
    this.profileForm.patchValue({
      nome: this.userData.nome,
      email: this.userData.email,
      altura: this.userData.altura,
      peso: this.userData.peso,
      idade: this.userData.idade,
      sexo: this.userData.sexo,
      nivelAtividade: this.userData.nivelAtividade,
      objetivo: this.userData.objetivo,
      semAlergias: this.userData.semAlergias,
      semComorbidades: this.userData.semComorbidades
    });

    if (!this.userData.semAlergias) {
      this.alergiasAlimentaresSelecionadas.forEach(alergia => {
        this.alergiasFormArray.push(new FormControl(alergia.id));
      });
    }

    if (!this.userData.semComorbidades) {
      this.comorbidadesSelecionadas.forEach(comorbidade => {
        this.comorbidadesFormArray.push(new FormControl(comorbidade.id));
      });
    }
  }

  get alergiasFormArray(): FormArray {
    return this.profileForm.get('alergiasAlimentares') as FormArray;
  }

  get comorbidadesFormArray(): FormArray {
    return this.profileForm.get('comorbidades') as FormArray;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.enableForm();
    } else {
      this.disableForm();
    }
  }

  enableForm(): void {
    this.profileForm.enable();
    this.profileForm.get('email').disable();
  }

  disableForm(): void {
    this.profileForm.disable();
  }

  isAlergiaSelected(alergia: AlergiaAlimentar): boolean {
    return this.alergiasAlimentaresSelecionadas.some(a => a.id === alergia.id);
  }

  isComorbidadeSelected(comorbidade: Comorbidade): boolean {
    return this.comorbidadesSelecionadas.some(c => c.id === comorbidade.id);
  }

  toggleAlergia(alergia: AlergiaAlimentar, event: any): void {
    if (this.profileForm.get('semAlergias').value) {
      event.source.checked = false;
      return;
    }

    const index = this.alergiasAlimentaresSelecionadas.findIndex(a => a.id === alergia.id);

    if (event.checked) {
      if (index === -1) {
        this.alergiasAlimentaresSelecionadas.push(alergia);
        this.alergiasFormArray.push(new FormControl(alergia.id));
      }
    } else {
      if (index > -1) {
        this.alergiasAlimentaresSelecionadas.splice(index, 1);
        this.removeControlFromArray(this.alergiasFormArray, alergia.id);
      }
    }
  }

  toggleComorbidade(comorbidade: Comorbidade, event: any): void {
    if (this.profileForm.get('semComorbidades').value) {
      event.source.checked = false;
      return;
    }

    const index = this.comorbidadesSelecionadas.findIndex(c => c.id === comorbidade.id);

    if (event.checked) {
      if (index === -1) {
        this.comorbidadesSelecionadas.push(comorbidade);
        this.comorbidadesFormArray.push(new FormControl(comorbidade.id));
      }
    } else {
      if (index > -1) {
        this.comorbidadesSelecionadas.splice(index, 1);
        this.removeControlFromArray(this.comorbidadesFormArray, comorbidade.id);
      }
    }
  }

  removerAlergia(alergia: AlergiaAlimentar): void {
    const index = this.alergiasAlimentaresSelecionadas.findIndex(a => a.id === alergia.id);
    if (index > -1) {
      this.alergiasAlimentaresSelecionadas.splice(index, 1);
      this.removeControlFromArray(this.alergiasFormArray, alergia.id);
    }
  }

  removerComorbidade(comorbidade: Comorbidade): void {
    const index = this.comorbidadesSelecionadas.findIndex(c => c.id === comorbidade.id);
    if (index > -1) {
      this.comorbidadesSelecionadas.splice(index, 1);
      this.removeControlFromArray(this.comorbidadesFormArray, comorbidade.id);
    }
  }

  private removeControlFromArray(formArray: FormArray, value: string): void {
    const index = (formArray.value as string[]).findIndex(val => val === value);
    if (index > -1) {
      formArray.removeAt(index);
    }
  }

  submitForm(): void {
    if (this.profileForm.valid) {
      console.log('Perfil atualizado:', this.profileForm.value);
      console.log('Alergias selecionadas:', this.alergiasAlimentaresSelecionadas);
      console.log('Comorbidades selecionadas:', this.comorbidadesSelecionadas);

      this.userData = {
        ...this.userData,
        nome: this.profileForm.get('nome').value,
        altura: this.profileForm.get('altura').value,
        peso: this.profileForm.get('peso').value,
        idade: this.profileForm.get('idade').value,
        sexo: this.profileForm.get('sexo').value,
        nivelAtividade: this.profileForm.get('nivelAtividade').value,
        objetivo: this.profileForm.get('objetivo').value,
        semAlergias: this.profileForm.get('semAlergias').value,
        semComorbidades: this.profileForm.get('semComorbidades').value
      };

      this.toggleEditMode();
    } else {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key).markAsTouched();
      });
    }
  }

  cancelEdit(): void {
    this.fillFormWithUserData();
    this.toggleEditMode();
  }
}
