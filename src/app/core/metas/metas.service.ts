import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { MetaRequestDTO } from './metas.types';
@Injectable({
    providedIn: 'root',
})
export class MetaService {
    private _apiService = inject(ApiService);

    criarMeta(meta: MetaRequestDTO): Observable<any> {
        return this._apiService.post<any>('/api/metas', meta);
    }
}
