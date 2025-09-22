import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { ApiService } from 'app/core/services/api.service';
import { UserService } from 'app/core/user/user.service';
import {
    SignInRequest,
    SignInResponse,
    SignUpRequest,
    User,
} from 'app/core/user/user.types';
import Cookies from 'js-cookie';
import {
    catchError,
    map,
    Observable,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _apiService = inject(ApiService);
    private _router = inject(Router);
    private _loginRealizado: boolean = false;
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */

    set accessToken(token: string) {
        Cookies.set('accessToken', token, {
            expires: 7,
            path: '/',
            secure: true,
            sameSite: 'Strict',
        });
    }

    get accessToken(): string {
        return Cookies.get('accessToken') ?? '';
    }
    set sessionToken(token: string) {
        Cookies.set('sessionToken', token, {
            expires: 7,
            path: '/',
            secure: true,
            sameSite: 'Strict',
        });
    }

    get sessionToken(): string {
        return Cookies.get('sessionToken') ?? '';
    }

    deleteTokens(): void {
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('sessionToken', { path: '/' });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        console.log('aquiiii ', email);
        this._apiService
            .post('/auth/forgot-password', { email: email })
            .subscribe((response: any) => {
                console.log(response);
            });
        return of(true);
    }

    /**
     * Reset password
     *
     * @param password
     */
    changePassword(token: string, password: string): Observable<any> {
        const payloadChangePassword = {
            token: token,
            password: password,
        };
        return this._apiService.patch(
            '/auth/change-password',
            payloadChangePassword
        );
    }
    verifyEmail(token: string): Observable<boolean> {
        return this._apiService
            .post('/auth/verify-email', {
                tokenForgotPassword: token,
            })
            .pipe(
                switchMap((response: { verified: boolean }) =>
                    of(response.verified)
                )
            );
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signInGoogle(): void {
        window.location.href =
            'https://ttfdietbackend.tigasolutions.com.br/oauth2/authorization/google';
    }
    signIn(credentials: SignInRequest): Observable<SignInResponse> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('Usuário já está logado.');
        }
        this._loginRealizado = false;
        return this._apiService.post<any>('/auth/login', credentials).pipe(
            tap((response: any) => {
                // Store the access token in the local storage
                this.accessToken = response.token;
                this.sessionToken = response.sessionToken;
                console.log(response.token, response.sessionToken);
                // Set the authenticated flag to true
                this._authenticated = true;
            }),
            switchMap((response: any) => {
                return this._userService.getProfile().pipe(
                    tap((user: User) => {}),
                    switchMap((user: User) => {
                        this._loginRealizado = true;
                        return of({
                            token: response.token,
                            user: user,
                        } as SignInResponse);
                    })
                );
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        console.log('signInUsingToken() chamado');

        if (!this.accessToken || AuthUtils.isTokenExpired(this.accessToken)) {
            console.log('Token inválido ou expirado');
            return of(false);
        }

        this._authenticated = true;
        console.log('Marcado como autenticado, carregando perfil...');

        return this._userService.getProfile().pipe(
            take(1),
            tap((user: User) => {
                console.log('Perfil carregado:', user);
                if (user) {
                    this._loginRealizado = true;
                    console.log('Login realizado com sucesso');
                }
            }),
            switchMap((user: User) => {
                if (!user) {
                    console.log('Usuário não encontrado, limpando tokens');
                    this._authenticated = false;
                    this.deleteTokens();
                    return of(false);
                }
                return of(true);
            }),
            catchError(() => {
                this._authenticated = false;
                this.deleteTokens();
                return of(false);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        if (this._authenticated) {
            this._apiService
                .post('/auth/logoff', {
                    sessionToken: this.sessionToken,
                    accessToken: this.accessToken,
                })
                .subscribe((response: any) => {
                    console.log(response);
                });
        }

        // Set the authenticated flag to false
        this._authenticated = false;
        this.deleteTokens();
        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: SignUpRequest): Observable<any> {
        return this._apiService.post('/auth/register', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        console.log('AuthService.check() called');

        // Se não há tokens, retorna false
        if (!this.accessToken || !this.sessionToken) {
            console.log('Tokens não encontrados');
            return of(false);
        }

        // Verifica se o token expirou
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            console.log('Token expirado');
            this.deleteTokens();
            return of(false);
        }

        // Se já está autenticado e o login foi realizado, verifica a sessão
        if (this._authenticated && this._loginRealizado) {
            console.log('Verificando sessão existente...');
            return this._apiService
                .post('/auth/verifySession', {
                    sessionToken: this.sessionToken,
                    accessToken: this.accessToken,
                })
                .pipe(
                    tap((response: any) => {
                        console.log('Verificação de sessão:', response);
                        if (response.logado !== true) {
                            this.deleteTokens();
                            this._authenticated = false;
                        }
                    }),
                    map((response: any) => response.logado === true),
                    catchError((error) => {
                        console.error('Erro na verificação de sessão:', error);
                        this.deleteTokens();
                        this._authenticated = false;
                        return of(false);
                    })
                );
        }

        // Se tem token válido mas não está autenticado, tenta autenticar
        console.log('Tentando autenticar com token...');
        return this.signInUsingToken();
    }
}
