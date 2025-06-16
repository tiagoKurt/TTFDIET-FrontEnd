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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { NotificationService } from 'app/core/services/notification.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
    styles: [`
        auth-forgot-password {
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
export class AuthForgotPasswordComponent implements OnInit {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    forgotPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    isLoading: boolean = false;
    emailSent: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
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
        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
        });

        // Subscribe to form value changes for real-time validation feedback
        this.forgotPasswordForm.valueChanges.subscribe(() => {
            if (this.showAlert && this.alert.type === 'error') {
                this.showAlert = false;
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the reset link
     */
    sendResetLink(): void {
        // Mark all fields as touched to show validation errors
        this.forgotPasswordForm.markAllAsTouched();

        // Return if the form is invalid
        if (this.forgotPasswordForm.invalid) {
            this._showFormErrors();
            return;
        }

        // Set loading state
        this.isLoading = true;

        // Disable the form
        this.forgotPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        const email = this.forgotPasswordForm.get('email').value.trim().toLowerCase();

        // Forgot password
        this._authService
            .forgotPassword(email)
            .pipe(
                finalize(() => {
                    // Reset loading state
                    this.isLoading = false;

                    // Re-enable the form
                    this.forgotPasswordForm.enable();

                    // Show the alert
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: (response) => {
                    // Mark as email sent
                    this.emailSent = true;

                    // Show success notification
                    this._notificationService.success(
                        'Link de recuperação enviado! Verifique seu email.'
                    );

                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message:
                            'Link de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.',
                    };

                    // Reset the form
                    this.forgotPasswordNgForm.resetForm();
                },
                error: (error) => {
                    // Show error notification
                    const errorMessage = this._getErrorMessage(error);
                    this._notificationService.error(errorMessage);

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: errorMessage,
                    };
                }
            });
    }

    /**
     * Get user-friendly error message
     */
    private _getErrorMessage(error: any): string {
        if (error.status === 404) {
            return 'Email não encontrado. Verifique o endereço digitado ou crie uma nova conta.';
        } else if (error.status === 429) {
            return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
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
        const emailControl = this.forgotPasswordForm.get('email');

        if (emailControl?.hasError('required')) {
            this._notificationService.error('Email é obrigatório');
        } else if (emailControl?.hasError('email')) {
            this._notificationService.error('Por favor, insira um email válido');
        }
    }

    /**
     * Check if field has error and is touched
     */
    hasFieldError(fieldName: string, errorType?: string): boolean {
        const field = this.forgotPasswordForm.get(fieldName);
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
        const field = this.forgotPasswordForm.get(fieldName);
        if (!field || !field.errors) return '';

        if (field.hasError('required')) {
            return 'Email é obrigatório';
        }
        if (field.hasError('email')) {
            return 'Por favor, insira um endereço de email válido';
        }

        return 'Campo inválido';
    }

    /**
     * Resend email
     */
    resendEmail(): void {
        if (this.emailSent && !this.isLoading) {
            this.sendResetLink();
        }
    }
}
