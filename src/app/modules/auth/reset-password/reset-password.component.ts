import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
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
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert = false;

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // Inicializa o formulário corretamente aqui 👇
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', [Validators.required]],
                passwordConfirm: ['', [Validators.required]],
            },
            {
                validators: [this.mustMatch('password', 'passwordConfirm')],
            }
        );

        // Captura token, se houver
        const token = this._route.snapshot.queryParamMap.get('token');

        if (token) {
            this._authService.verifyEmail(token).subscribe({
                next: (response) => {
                    if (!response) {
                        this._router.navigate(['/home']);
                    }
                },
                error: () => {
                    this._router.navigate(['/home']);
                },
            });
        }
    }

    resetPassword(): void {
        if (this.resetPasswordForm.invalid) return;

        this.resetPasswordForm.disable();
        this.showAlert = false;
        const token = this._route.snapshot.queryParamMap.get('token');
        this._authService
            .changePassword(token, this.resetPasswordForm.get('password').value)
            .pipe(
                finalize(() => {
                    this.resetPasswordForm.enable();
                    this.resetPasswordNgForm.resetForm();
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: () => {
                    this.alert = {
                        type: 'success',
                        message: 'Your password has been reset.',
                    };
                },
                error: () => {
                    this.alert = {
                        type: 'error',
                        message: 'Something went wrong, please try again.',
                    };
                },
            });
    }

    /**
     * Validador customizado para verificar se password === passwordConfirm
     */
    private mustMatch(controlName: string, matchingControlName: string) {
        return (formGroup: UntypedFormGroup): ValidationErrors | null => {
            const control = formGroup.controls[controlName];
            const matchingControl = formGroup.controls[matchingControlName];

            if (matchingControl.errors && !matchingControl.errors.mustMatch) {
                return null;
            }

            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ mustMatch: true });
            } else {
                matchingControl.setErrors(null);
            }

            return null;
        };
    }
}
