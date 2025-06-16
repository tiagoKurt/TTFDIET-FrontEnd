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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { NotificationService } from 'app/core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
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
        auth-sign-in {
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
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    isLoading: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
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
        // Create the form
        this.signInForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            senha: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false],
        });

        // Subscribe to form value changes for real-time validation feedback
        this.signInForm.valueChanges.subscribe(() => {
            if (this.showAlert && this.alert.type === 'error') {
                this.showAlert = false;
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        // Mark all fields as touched to show validation errors
        this.signInForm.markAllAsTouched();

        // Return if the form is invalid
        if (this.signInForm.invalid) {
            this._showFormErrors();
            return;
        }

        // Set loading state
        this.isLoading = true;

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Get form values
        const formValues = this.signInForm.value;

        // Prepare login data
        const loginData = {
            email: formValues.email?.trim().toLowerCase(),
            senha: formValues.senha,
        };

        // Validate data before sending
        if (!loginData.email || !loginData.senha) {
            this._notificationService.error(
                'Por favor, preencha email e senha'
            );
            this._resetForm();
            return;
        }

        // Sign in
        this._authService.signIn(loginData).subscribe({
            next: (response) => {
                // Show success notification
                this._notificationService.success(
                    'Login realizado com sucesso!'
                );

                // Set success alert
                this.alert = {
                    type: 'success',
                    message: 'Login realizado com sucesso! Redirecionando...',
                };
                this.showAlert = true;

                // Check preRegister status and redirect accordingly
                setTimeout(() => {
                    if (response.user.preRegister === true) {
                        this._router.navigate(['/home']);
                    } else {
                        this._router.navigate(['/pre-register']);
                    }
                }, 1500);
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
            },
        });
    }

    /**
     * Get user-friendly error message
     */
    private _getErrorMessage(error: any): string {
        if (error.status === 401) {
            return 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.status === 403) {
            return 'Sua conta foi bloqueada. Entre em contato com o suporte.';
        } else if (error.status === 404) {
            return 'Conta não encontrada. Verifique seu email ou crie uma nova conta.';
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
        const emailControl = this.signInForm.get('email');
        const senhaControl = this.signInForm.get('senha');

        if (emailControl?.hasError('required')) {
            this._notificationService.error('Email é obrigatório');
        } else if (emailControl?.hasError('email')) {
            this._notificationService.error('Por favor, insira um email válido');
        } else if (senhaControl?.hasError('required')) {
            this._notificationService.error('Senha é obrigatória');
        } else if (senhaControl?.hasError('minlength')) {
            this._notificationService.error('Senha deve ter pelo menos 6 caracteres');
        }
    }

    /**
     * Reset form to initial state
     */
    private _resetForm(): void {
        this.isLoading = false;
        this.signInForm.enable();
    }

    /**
     * Check if field has error and is touched
     */
    hasFieldError(fieldName: string, errorType?: string): boolean {
        const field = this.signInForm.get(fieldName);
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
        const field = this.signInForm.get(fieldName);
        if (!field || !field.errors) return '';

        if (field.hasError('required')) {
            return `${fieldName === 'email' ? 'Email' : 'Senha'} é obrigatório`;
        }
        if (field.hasError('email')) {
            return 'Por favor, insira um endereço de email válido';
        }
        if (field.hasError('minlength')) {
            return 'Senha deve ter pelo menos 6 caracteres';
        }

        return 'Campo inválido';
    }
}
