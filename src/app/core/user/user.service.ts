import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User, UpdateUserRequest } from 'app/core/user/user.types';
import { ApiService } from 'app/core/services/api.service';
import { map, Observable, ReplaySubject, tap, catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _httpClient = inject(HttpClient);
    private _apiService = inject(ApiService);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {
        return this._httpClient.get<User>('api/common/user').pipe(
            tap((user) => {
                this._user.next(user);
            })
        );
    }

    /**
     * Get user profile from API
     */
    getProfile(): Observable<User> {
        return this._apiService.get<User>('/user/profile').pipe(
            tap((user) => {
                if (user) {
                    this._user.next(user);
                }
            }),
            catchError((error) => {
                this._user.next(null);
                return throwError(() => error);
            })
        );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: UpdateUserRequest): Observable<User> {
        return this._apiService.put<User>('/user/update', user).pipe(
            tap((response) => {
                this._user.next(response);
            })
        );
    }
}
