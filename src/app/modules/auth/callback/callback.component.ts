import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-callback',
    templateUrl: './callback.component.html',
    standalone: true,
    imports: [CommonModule],
})
export class CallbackComponent implements OnInit {
    constructor(
        private _router: Router,
        private _ngZone: NgZone,
        private _authService: AuthService
    ) {}

    ngOnInit(): void {
        console.log('Callback component initialized');

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const sessionToken = params.get('sessionToken');
        const preRegister = params.get('preRegister');

        console.log('URL parameters:', {
            token: !!token,
            sessionToken: !!sessionToken,
            preRegister: preRegister,
        });

        if (!token || !sessionToken) {
            console.error('Tokens não encontrados na URL');
            this._ngZone.run(() => {
                this._router.navigate(['/sign-in']);
            });
            return;
        }

        // Usa o AuthService para gerenciar os tokens corretamente
        this._authService.accessToken = token;
        this._authService.sessionToken = sessionToken;

        console.log('Tokens salvos, iniciando verificação...');

        // Aguarda 2 segundos para mostrar a tela de carregamento
        setTimeout(() => {
            // Verifica a autenticação e carrega o perfil do usuário
            this._authService.signInUsingToken().subscribe({
                next: (isAuthenticated) => {
                    console.log('Resultado da autenticação:', isAuthenticated);
                    if (isAuthenticated) {
                        // Aguarda um pouco mais para o UserService ser atualizado
                        setTimeout(() => {
                            this._ngZone.run(() => {
                                // Verifica o parâmetro preRegister para decidir o redirecionamento
                                if (preRegister === 'false') {
                                    console.log(
                                        'PreRegister é false, redirecionando para /pre-register'
                                    );
                                    this._router.navigate(['/pre-register']);
                                } else {
                                    console.log(
                                        'Redirecionando para página inicial...'
                                    );
                                    this._router.navigate(['/']);
                                }
                            });
                        }, 500);
                    } else {
                        console.error('Falha na autenticação');
                        this._ngZone.run(() => {
                            this._router.navigate(['/sign-in']);
                        });
                    }
                },
                error: (error) => {
                    console.error('Erro na autenticação:', error);
                    this._ngZone.run(() => {
                        this._router.navigate(['/sign-in']);
                    });
                },
            });
        }, 200);
    }
}
