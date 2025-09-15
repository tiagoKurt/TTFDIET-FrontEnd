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
        console.log('Logando com google ');
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
        if (!this.accessToken || AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        this._authenticated = true;

        return this._userService.getProfile().pipe(
            take(1),
            switchMap((user: User) => {
                if (!user) {
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
        // Check if the user is logged in
        if (this._authenticated) {
            if (this._loginRealizado) {
                if (this.accessToken && this.sessionToken) {
                    this._apiService
                        .post('/auth/verifySession', {
                            sessionToken: this.sessionToken,
                            accessToken: this.accessToken,
                        })
                        .subscribe((response: any) => {
                            console.log(response);
                            if (response.logado !== true) {
                                this.deleteTokens();
                            }
                            this._authenticated = response.logado;
                        });
                }
            }
        }
        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            localStorage.removeItem('accessToken');
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
