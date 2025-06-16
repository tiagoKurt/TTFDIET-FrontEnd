import { Routes } from '@angular/router';
import { MetasComponent } from './metas.component';

export default [
    {
        path: '',
        component: MetasComponent,
        data: {
            title: 'Metas'
        }
    }
] as Routes;
