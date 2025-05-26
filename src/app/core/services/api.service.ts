import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    get<T>(endpoint: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
            headers: this.getHeaders()
        });
    }

    post<T>(endpoint: string, data: any): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        return this.http.post<T>(url, data, {
            headers: this.getHeaders()
        });
    }

    put<T>(endpoint: string, data: any): Observable<T> {
        const url = `${this.baseUrl}${endpoint}`;
        return this.http.put<T>(url, data, {
            headers: this.getHeaders()
        });
    }

    patch<T>(endpoint: string, data: any): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, {
            headers: this.getHeaders()
        });
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
            headers: this.getHeaders()
        });
    }
}
