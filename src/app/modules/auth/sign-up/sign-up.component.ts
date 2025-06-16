import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { NotificationService } from 'app/core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
    styles: [`
        auth-sign-up {
            display: block;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }

        .auth-container {
            height: 100vh;
            width: 100vw;
            max-height: 100vh;
            max-width: 100vw;
        }
    `]
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    isLoading: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _notificationService: NotificationService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Password pattern: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

        // Create the form
        this.signUpForm = this._formBuilder.group({
            nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            email: ['', [Validators.required, Validators.email]],
            senha: ['', [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)]],
            agreements: [false, [Validators.requiredTrue]],
        });

        // Subscribe to form value changes for real-time validation feedback
        this.signUpForm.valueChanges.subscribe(() => {
            if (this.showAlert && this.alert.type === 'error') {
                this.showAlert = false;
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign up
     */
    signUp(): void {
        // Mark all fields as touched to show validation errors
        this.signUpForm.markAllAsTouched();

        // Validate form
        if (this.signUpForm.invalid) {
            this._showFormErrors();
            return;
        }

        // Get form values
        const formValues = this.signUpForm.value;

        // Additional validation
        if (!formValues.nome?.trim() || !formValues.email?.trim() || !formValues.senha || !formValues.agreements) {
            this._notificationService.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Set loading state
        this.isLoading = true;

        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Prepare the data for sign up (exclude agreements field)
        const signUpData = {
            nome: formValues.nome.trim(),
            email: formValues.email.trim().toLowerCase(),
            senha: formValues.senha
        };

        // Sign up
        this._authService.signUp(signUpData).subscribe({
            next: (response) => {
                // Show success notification
                this._notificationService.success('Conta criada com sucesso! Redirecionando para login...');

                // Set the alert
                this.alert = {
                    type: 'success',
                    message: 'Conta criada com sucesso! Redirecionando para o login...',
                };

                // Show the alert
                this.showAlert = true;

                // Navigate to sign-in page after a delay
                setTimeout(() => {
                    this._router.navigate(['/sign-in']);
                }, 2500);
            },
            error: (error) => {
                // Reset form state
                this._resetForm();

                // Show error notification
                const errorMessage = this._getErrorMessage(error);
                this._notificationService.error(errorMessage);

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };

                // Show the alert
                this.showAlert = true;
            }
        });
    }

    /**
     * Get password strength (1-4)
     */
    getPasswordStrength(): number {
        const password = this.signUpForm.get('senha')?.value || '';

        if (password.length === 0) return 0;

        let strength = 0;

        // Length check
        if (password.length >= 8) strength++;

        // Uppercase check
        if (/[A-Z]/.test(password)) strength++;

        // Lowercase check
        if (/[a-z]/.test(password)) strength++;

        // Number check
        if (/\d/.test(password)) strength++;

        // Special character check (bonus)
        if (/[@$!%*?&]/.test(password) && strength === 4) strength = 4;

        return strength;
    }

    /**
     * Get password strength text
     */
    getPasswordStrengthText(): string {
        const strength = this.getPasswordStrength();

        switch (strength) {
            case 1:
                return 'Muito fraca';
            case 2:
                return 'Fraca';
            case 3:
                return 'Boa';
            case 4:
                return 'Forte';
            default:
                return '';
        }
    }

    /**
     * Get user-friendly error message
     */
    private _getErrorMessage(error: any): string {
        if (error.status === 409) {
            return 'Este email já está cadastrado. Tente fazer login ou use outro email.';
        } else if (error.status === 400) {
            return 'Dados inválidos. Verifique as informações e tente novamente.';
        } else if (error.status === 422) {
            return 'Email inválido ou senha não atende aos critérios de segurança.';
        } else if (error.status === 0) {
            return 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
            return error.error?.message || 'Erro inesperado. Tente novamente em alguns minutos.';
        }
    }

    /**
     * Show form validation errors
     */
    private _showFormErrors(): void {
        const nomeControl = this.signUpForm.get('nome');
        const emailControl = this.signUpForm.get('email');
        const senhaControl = this.signUpForm.get('senha');
        const agreementsControl = this.signUpForm.get('agreements');

        if (nomeControl?.hasError('required')) {
            this._notificationService.error('Nome completo é obrigatório');
        } else if (nomeControl?.hasError('minlength')) {
            this._notificationService.error('Nome deve ter pelo menos 2 caracteres');
        } else if (emailControl?.hasError('required')) {
            this._notificationService.error('Email é obrigatório');
        } else if (emailControl?.hasError('email')) {
            this._notificationService.error('Por favor, insira um email válido');
        } else if (senhaControl?.hasError('required')) {
            this._notificationService.error('Senha é obrigatória');
        } else if (senhaControl?.hasError('minlength')) {
            this._notificationService.error('Senha deve ter pelo menos 8 caracteres');
        } else if (senhaControl?.hasError('pattern')) {
            this._notificationService.error('Senha deve conter ao menos uma letra maiúscula, minúscula e um número');
        } else if (agreementsControl?.hasError('required')) {
            this._notificationService.error('Você deve aceitar os termos para continuar');
        }
    }

    /**
     * Reset form to initial state
     */
    private _resetForm(): void {
        this.isLoading = false;
        this.signUpForm.enable();
    }

    /**
     * Check if field has error and is touched
     */
    hasFieldError(fieldName: string, errorType?: string): boolean {
        const field = this.signUpForm.get(fieldName);
        if (!field) return false;

        if (errorType) {
            return field.hasError(errorType) && field.touched;
        }
        return field.invalid && field.touched;
    }

    /**
     * Get field error message
     */
    getFieldErrorMessage(fieldName: string): string {
        const field = this.signUpForm.get(fieldName);
        if (!field || !field.errors) return '';

        if (field.hasError('required')) {
            const fieldLabels: { [key: string]: string } = {
                'nome': 'Nome completo',
                'email': 'Email',
                'senha': 'Senha',
                'agreements': 'Aceitar termos'
            };
            return `${fieldLabels[fieldName]} é obrigatório`;
        }
        if (field.hasError('email')) {
            return 'Por favor, insira um endereço de email válido';
        }
        if (field.hasError('minlength')) {
            if (fieldName === 'nome') {
                return 'Nome deve ter pelo menos 2 caracteres';
            }
            if (fieldName === 'senha') {
                return 'Senha deve ter pelo menos 8 caracteres';
            }
        }
        if (field.hasError('pattern') && fieldName === 'senha') {
            return 'Senha deve conter ao menos uma letra maiúscula, minúscula e um número';
        }
        if (field.hasError('maxlength')) {
            return 'Nome muito longo (máximo 100 caracteres)';
        }

        return 'Campo inválido';
    }

    /**
     * Clean name input (remove extra spaces and format)
     */
    formatNameInput(): void {
        const nomeControl = this.signUpForm.get('nome');
        if (nomeControl?.value) {
            const cleanedName = nomeControl.value
                .trim()
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .toLowerCase()
                .replace(/\b\w/g, (char: string) => char.toUpperCase()); // Capitalize first letter of each word

            if (cleanedName !== nomeControl.value) {
                nomeControl.patchValue(cleanedName);
            }
        }
    }
}
