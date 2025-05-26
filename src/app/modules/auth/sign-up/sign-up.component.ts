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

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
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
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;

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
        // Create the form
        this.signUpForm = this._formBuilder.group({
            nome: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            senha: ['', [Validators.required]],
            agreements: [false, [Validators.requiredTrue]],
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

        // Get form values
        const formValues = this.signUpForm.value;

        // Validate required fields
        if (!formValues.nome || !formValues.email || !formValues.senha || !formValues.agreements) {
            this._notificationService.error('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Do nothing if the form is invalid
        if (this.signUpForm.invalid) {
            this._notificationService.error('Por favor, corrija os erros no formulário');
            return;
        }

        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Prepare the data for sign up (exclude agreements field)
        const signUpData = {
            nome: formValues.nome?.trim(),
            email: formValues.email?.trim(),
            senha: formValues.senha
        };

        // Validate data before sending
        if (!signUpData.nome || !signUpData.email || !signUpData.senha) {
            this._notificationService.error('Erro: Dados do formulário estão vazios');
            this.signUpForm.enable();
            return;
        }

        // Sign up
        this._authService.signUp(signUpData).subscribe({
            next: (response) => {
                // Show success notification
                this._notificationService.success('Conta criada com sucesso! Redirecionando para login...');

                // Set the alert
                this.alert = {
                    type: 'success',
                    message: 'Conta criada com sucesso! Você pode fazer login agora.',
                };

                // Show the alert
                this.showAlert = true;

                // Navigate to sign-in page after a delay
                setTimeout(() => {
                    this._router.navigate(['/sign-in']);
                }, 2000);
            },
            error: (error) => {
                // Re-enable the form
                this.signUpForm.enable();

                // Show error notification
                const errorMessage = error.error?.message || 'Erro ao criar conta. Tente novamente.';
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
}
