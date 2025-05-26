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

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
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
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;

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
            senha: ['', Validators.required],
            rememberMe: [''],
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
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Get form values
        const formValues = this.signInForm.value;

        // Prepare login data
        const loginData = {
            email: formValues.email?.trim(),
            senha: formValues.senha
        };

        // Validate data before sending
        if (!loginData.email || !loginData.senha) {
            this._notificationService.error('Por favor, preencha email e senha');
            this.signInForm.enable();
            return;
        }

        // Sign in
        this._authService.signIn(loginData).subscribe({
            next: (response) => {
                // Show success notification
                this._notificationService.success('Login realizado com sucesso!');

                // Check preRegister status and redirect accordingly
                if (response.user.preRegister === true) {
                    this._router.navigate(['/home']);
                } else {
                    this._router.navigate(['/pre-register']);
                }
            },
            error: (error) => {
                // Re-enable the form
                this.signInForm.enable();

                // Show error notification
                const errorMessage = error.error?.message || 'Email ou senha incorretos';
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
