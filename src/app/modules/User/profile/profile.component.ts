import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from 'app/core/user/user.service';
import { User, UpdateUserRequest } from 'app/core/user/user.types';
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
    MatTooltipModule,
    MatStepperModule,
    MatProgressBarModule
  ],
  templateUrl: './profile.component.html',
  animations: fuseAnimations
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  editMode = false;
  currentUser: User;
  isLoading = false;
  perfilCompleto = false;

  objetivos = [
    { value: 'PERDER_PESO', label: 'Perder Peso', icon: 'trending_down', color: 'text-red-500' },
    { value: 'MANTER_PESO', label: 'Manter Peso', icon: 'balance', color: 'text-blue-500' },
    { value: 'GANHAR_MASSA', label: 'Ganhar Massa Muscular', icon: 'trending_up', color: 'text-green-500' }
  ];

  niveisAtividade = [
    { value: 'SEDENTARIO', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
    { value: 'LEVE', label: 'Leve', desc: 'Exercício leve 1-3 dias/semana' },
    { value: 'MODERADO', label: 'Moderado', desc: 'Exercício moderado 3-5 dias/semana' },
    { value: 'INTENSO', label: 'Intenso', desc: 'Exercício intenso 6-7 dias/semana' },
    { value: 'ATLETA', label: 'Atleta', desc: 'Exercício muito intenso, trabalho físico' }
  ];

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
    { id: 'diabetes', nome: 'Diabetes Mellitus', descricao: 'Controle de carboidratos e açúcares' },
    { id: 'hipertensao', nome: 'Hipertensão Arterial', descricao: 'Redução de sódio' },
    { id: 'dislipidemia', nome: 'Colesterol Alto', descricao: 'Redução de gorduras saturadas' },
    { id: 'obesidade', nome: 'Obesidade', descricao: 'Controle calórico' },
    { id: 'doenca_celiaca', nome: 'Doença Celíaca', descricao: 'Eliminação total do glúten' },
    { id: 'intolerancia_lactose', nome: 'Intolerância à Lactose', descricao: 'Restrição de lactose' },
    { id: 'doenca_renal', nome: 'Doença Renal Crônica', descricao: 'Controle de proteínas e sódio' },
    { id: 'gastrite_ulcera', nome: 'Gastrite/Úlcera', descricao: 'Evitar alimentos ácidos' },
    { id: 'sii', nome: 'Síndrome do Intestino Irritável', descricao: 'Dieta FODMAP' },
    { id: 'anemia', nome: 'Anemia Ferropriva', descricao: 'Aumento de ferro' },
    { id: 'tireoide', nome: 'Problemas de Tireoide', descricao: 'Ajustes no iodo' },
    { id: 'gota', nome: 'Gota', descricao: 'Redução de purinas' }
  ];

  alergiasAlimentaresSelecionadas: AlergiaAlimentar[] = [];
  comorbidadesSelecionadas: Comorbidade[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _userService: UserService,
    private _notificationService: NotificationService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
  }

  initForm(): void {
    this.profileForm = this._formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      altura: ['', [Validators.required, Validators.min(50), Validators.max(260)]],
      peso: ['', [Validators.required, Validators.min(10), Validators.max(360)]],
      idade: ['', [Validators.required, Validators.min(4), Validators.max(120)]],
      sexo: ['', [Validators.required]],
      nivelAtividade: ['', [Validators.required]],
      objetivo: ['', [Validators.required]],
      semAlergias: [false],
      alergiasAlimentares: this._formBuilder.array([]),
      semComorbidades: [false],
      comorbidades: this._formBuilder.array([])
    });

    this.setupFormWatchers();
    this.disableForm();
  }

  setupFormWatchers(): void {
    this.profileForm.get('semAlergias')?.valueChanges.subscribe(valor => {
      if (valor) {
        this.alergiasAlimentaresSelecionadas = [];
        this.alergiasFormArray.clear();
      }
    });

    this.profileForm.get('semComorbidades')?.valueChanges.subscribe(valor => {
      if (valor) {
        this.comorbidadesSelecionadas = [];
        this.comorbidadesFormArray.clear();
      }
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.avaliarPerfilCompleto();
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this._userService.getProfile().subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.fillFormWithUserData();
          this.avaliarPerfilCompleto();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this._notificationService.error('Erro ao carregar dados do perfil');
        this.isLoading = false;
      }
    });
  }

  fillFormWithUserData(): void {
    if (!this.currentUser) return;

    this.profileForm.patchValue({
      nome: this.currentUser.nome || '',
      email: this.currentUser.email || '',
      altura: this.currentUser.altura || '',
      peso: this.currentUser.peso || '',
      idade: this.currentUser.idade || '',
      sexo: this.currentUser.sexo || '',
      nivelAtividade: this.currentUser.nivelAtividade || '',
      objetivo: this.currentUser.objetivoDieta || '',
      semAlergias: false,
      semComorbidades: false
    });
  }

  avaliarPerfilCompleto(): void {
    const camposObrigatorios = ['nome', 'email', 'altura', 'peso', 'idade', 'sexo', 'nivelAtividade', 'objetivo'];
    const formValues = this.profileForm.value;

    this.perfilCompleto = camposObrigatorios.every(campo =>
      formValues[campo] && formValues[campo].toString().trim() !== ''
    );
  }

  get alergiasFormArray(): FormArray {
    return this.profileForm.get('alergiasAlimentares') as FormArray;
  }

  get comorbidadesFormArray(): FormArray {
    return this.profileForm.get('comorbidades') as FormArray;
  }

  get porcentagemCompleta(): number {
    const camposObrigatorios = ['nome', 'email', 'altura', 'peso', 'idade', 'sexo', 'nivelAtividade', 'objetivo'];
    const formValues = this.profileForm.value;

    const camposPreenchidos = camposObrigatorios.filter(campo =>
      formValues[campo] && formValues[campo].toString().trim() !== ''
    ).length;

    return Math.round((camposPreenchidos / camposObrigatorios.length) * 100);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.enableForm();
    } else {
      this.disableForm();
      this.fillFormWithUserData();
    }
  }

  enableForm(): void {
    this.profileForm.enable();
    this.profileForm.get('email')?.disable();
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
    if (event.checked) {
      this.alergiasAlimentaresSelecionadas.push(alergia);
      this.alergiasFormArray.push(this._formBuilder.control(alergia.id));
    } else {
      this.removerAlergia(alergia);
    }
  }

  toggleComorbidade(comorbidade: Comorbidade, event: any): void {
    if (event.checked) {
      this.comorbidadesSelecionadas.push(comorbidade);
      this.comorbidadesFormArray.push(this._formBuilder.control(comorbidade.id));
    } else {
      this.removerComorbidade(comorbidade);
    }
  }

  removerAlergia(alergia: AlergiaAlimentar): void {
    this.alergiasAlimentaresSelecionadas = this.alergiasAlimentaresSelecionadas.filter(a => a.id !== alergia.id);
    this.removeControlFromArray(this.alergiasFormArray, alergia.id);
  }

  removerComorbidade(comorbidade: Comorbidade): void {
    this.comorbidadesSelecionadas = this.comorbidadesSelecionadas.filter(c => c.id !== comorbidade.id);
    this.removeControlFromArray(this.comorbidadesFormArray, comorbidade.id);
  }

  private removeControlFromArray(formArray: FormArray, value: string): void {
    const index = formArray.controls.findIndex(control => control.value === value);
    if (index !== -1) {
      formArray.removeAt(index);
    }
  }

  submitForm(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this._notificationService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.isLoading = true;
    const formData = this.profileForm.value;

    const updateRequest: UpdateUserRequest = {
      nome: formData.nome,
      altura: parseInt(formData.altura),
      peso: parseFloat(formData.peso),
      idade: parseInt(formData.idade),
      sexo: formData.sexo,
      nivelAtividade: formData.nivelAtividade,
      objetivoDieta: formData.objetivo,
      preRegister: true
    };

              this._userService.update(updateRequest).subscribe({
       next: (response) => {
         this.currentUser = response;
         this._userService.user = response;
        this.editMode = false;
        this.disableForm();
        this.isLoading = false;
        this._notificationService.success('Perfil atualizado com sucesso!');
        this.avaliarPerfilCompleto();
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.error('Erro ao atualizar perfil. Tente novamente.');
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    this.disableForm();
    this.fillFormWithUserData();
  }

  calcularIMC(): number {
    if (!this.currentUser?.altura || !this.currentUser?.peso) return 0;
    const alturaM = this.currentUser.altura / 100;
    return Math.round((this.currentUser.peso / (alturaM * alturaM)) * 10) / 10;
  }

  classificarIMC(): string {
    const imc = this.calcularIMC();
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidade';
  }

  obterCorIMC(): string {
    const imc = this.calcularIMC();
    if (imc < 18.5 || imc >= 30) return 'text-red-500';
    if (imc >= 25) return 'text-yellow-500';
    return 'text-green-500';
  }

  obterLabelNivelAtividade(): string {
    const nivel = this.niveisAtividade.find(n => n.value === this.currentUser?.nivelAtividade);
    return nivel ? nivel.label : 'Não informado';
  }

  obterLabelObjetivo(): string {
    const objetivo = this.objetivos.find(o => o.value === this.currentUser?.objetivoDieta);
    return objetivo ? objetivo.label : 'Não informado';
  }

  obterIconeObjetivo(): string {
    const objetivo = this.objetivos.find(o => o.value === this.currentUser?.objetivoDieta);
    return objetivo ? objetivo.icon : 'flag';
  }

  obterCorObjetivo(): string {
    const objetivo = this.objetivos.find(o => o.value === this.currentUser?.objetivoDieta);
    return objetivo ? objetivo.color : 'text-gray-500';
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo é obrigatório';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;

    return 'Campo inválido';
  }
}
