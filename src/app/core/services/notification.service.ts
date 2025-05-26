import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private _snackBar = inject(MatSnackBar);

    private defaultConfig: MatSnackBarConfig = {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
    };

    success(message: string, duration: number = 4000): void {
        this._snackBar.open(message, 'Fechar', {
            ...this.defaultConfig,
            duration,
            panelClass: ['success-snackbar']
        });
    }

    error(message: string, duration: number = 6000): void {
        this._snackBar.open(message, 'Fechar', {
            ...this.defaultConfig,
            duration,
            panelClass: ['error-snackbar']
        });
    }

    warning(message: string, duration: number = 5000): void {
        this._snackBar.open(message, 'Fechar', {
            ...this.defaultConfig,
            duration,
            panelClass: ['warning-snackbar']
        });
    }

    info(message: string, duration: number = 4000): void {
        this._snackBar.open(message, 'Fechar', {
            ...this.defaultConfig,
            duration,
            panelClass: ['info-snackbar']
        });
    }
}
