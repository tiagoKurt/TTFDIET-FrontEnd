import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { UserService } from 'app/core/user/user.service';
import { UpdateUserRequest } from 'app/core/user/user.types';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from 'app/core/services/notification.service';

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
  selector: 'app-pre-register',
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
    MatStepperModule,
    MatChipsModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule
  ],
  templateUrl: './pre-register.component.html'
})
export class PreRegisterComponent implements OnInit {
  preRegisterForm: FormGroup;
  currentStep = 0;
  totalSteps = 8;

  objetivos = Object.values(ObjetivoEnum);
  niveisAtividade = Object.values(NivelAtividadeEnum);

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

  semAlergias = false;
  semComorbidades = false;

  alergiasAlimentaresSelecionadas: AlergiaAlimentar[] = [];
  comorbidadesSelecionadas: Comorbidade[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _userService: UserService,
    private _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.preRegisterForm = this._formBuilder.group({
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
      sexo: ['', [
        Validators.required
      ]],
      nivelAtividade: ['', [
        Validators.required
      ]],
      objetivo: ['', [
        Validators.required
      ]],
      semAlergias: [false],
      alergiasAlimentares: this._formBuilder.array([]),
      semComorbidades: [false],
      comorbidades: this._formBuilder.array([])
    });

    this.preRegisterForm.get('semAlergias').valueChanges.subscribe(valor => {
      this.semAlergias = valor;
      if (valor) {
        this.alergiasAlimentaresSelecionadas = [];
        (this.preRegisterForm.get('alergiasAlimentares') as FormArray).clear();
      }
    });

    this.preRegisterForm.get('semComorbidades').valueChanges.subscribe(valor => {
      this.semComorbidades = valor;
      if (valor) {
        this.comorbidadesSelecionadas = [];
        (this.preRegisterForm.get('comorbidades') as FormArray).clear();
      }
    });
  }

  get alergiasFormArray(): FormArray {
    return this.preRegisterForm.get('alergiasAlimentares') as FormArray;
  }

  get comorbidadesFormArray(): FormArray {
    return this.preRegisterForm.get('comorbidades') as FormArray;
  }

  toggleAlergia(alergia: AlergiaAlimentar, event: any): void {
    if (this.semAlergias) {
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

  removerAlergia(alergia: AlergiaAlimentar): void {
    const index = this.alergiasAlimentaresSelecionadas.findIndex(a => a.id === alergia.id);
    if (index > -1) {
      this.alergiasAlimentaresSelecionadas.splice(index, 1);
      this.removeControlFromArray(this.alergiasFormArray, alergia.id);
    }
  }

  isAlergiaSelected(alergia: AlergiaAlimentar): boolean {
    return this.alergiasAlimentaresSelecionadas.some(a => a.id === alergia.id);
  }

  toggleComorbidade(comorbidade: Comorbidade, event: any): void {
    if (this.semComorbidades) {
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

  removerComorbidade(comorbidade: Comorbidade): void {
    const index = this.comorbidadesSelecionadas.findIndex(c => c.id === comorbidade.id);
    if (index > -1) {
      this.comorbidadesSelecionadas.splice(index, 1);
      this.removeControlFromArray(this.comorbidadesFormArray, comorbidade.id);
    }
  }

  isComorbidadeSelected(comorbidade: Comorbidade): boolean {
    return this.comorbidadesSelecionadas.some(c => c.id === comorbidade.id);
  }

  private removeControlFromArray(formArray: FormArray, value: string): void {
    const index = (formArray.value as string[]).findIndex(val => val === value);
    if (index > -1) {
      formArray.removeAt(index);
    }
  }

  isAlturaCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('altura');
    return control.invalid && (control.dirty || control.touched);
  }

  isPesoCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('peso');
    return control.invalid && (control.dirty || control.touched);
  }

  isIdadeCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('idade');
    return control.invalid && (control.dirty || control.touched);
  }

  isSexoCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('sexo');
    return control.invalid && (control.dirty || control.touched);
  }

  isNivelAtividadeCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('nivelAtividade');
    return control.invalid && (control.dirty || control.touched);
  }

  isObjetivoCampoInvalido(): boolean {
    const control = this.preRegisterForm.get('objetivo');
    return control.invalid && (control.dirty || control.touched);
  }

  isAlergiasValidas(): boolean {
    return this.semAlergias || this.alergiasAlimentaresSelecionadas.length > 0;
  }

  isComorbidadesValidas(): boolean {
    return this.semComorbidades || this.comorbidadesSelecionadas.length > 0;
  }

  nextStep(): void {
    if (this.isCurrentStepValid()) {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.preRegisterForm.get('altura').valid;
      case 1:
        return this.preRegisterForm.get('peso').valid;
      case 2:
        return this.preRegisterForm.get('idade').valid;
      case 3:
        return this.preRegisterForm.get('sexo').valid;
      case 4:
        return this.preRegisterForm.get('nivelAtividade').valid;
      case 5:
        return this.preRegisterForm.get('objetivo').valid;
      case 6:
        return this.isAlergiasValidas();
      case 7:
        return this.isComorbidadesValidas();
      default:
        return false;
    }
  }

  submitForm(): void {
    if (this.preRegisterForm.valid && this.isAlergiasValidas() && this.isComorbidadesValidas()) {
      const formData = this.preRegisterForm.value;

      const updateData: UpdateUserRequest = {
        altura: formData.altura,
        peso: formData.peso,
        idade: formData.idade,
        sexo: formData.sexo,
        nivelAtividade: formData.nivelAtividade,
        objetivoDieta: formData.objetivo,
        preRegister: true
      };

      this._userService.update(updateData).subscribe({
        next: (response) => {
          // Update user service with the response
          this._userService.user = response;

          // Show success notification
          this._notificationService.success('Pré-registro concluído com sucesso!');

          // Redirect to home - the guard should handle the routing correctly
          this._router.navigate(['/home']);
        },
        error: (error) => {
          // Show error notification
          const errorMessage = error.error?.message || 'Erro ao concluir pré-registro. Tente novamente.';
          this._notificationService.error(errorMessage);
        }
      });
    } else {
      Object.keys(this.preRegisterForm.controls).forEach(key => {
        const control = this.preRegisterForm.get(key);
        control?.markAsTouched();
      });

      this._notificationService.warning('Por favor, preencha todos os campos obrigatórios corretamente.');
    }
  }
}
