import { Routes } from '@angular/router';

export default [
    {
        path: 'diario',
        loadComponent: () => import('./diario/planejamento-diario.component').then(m => m.PlanejamentoDiarioComponent)
    },
    {
        path: '',
        redirectTo: 'diario',
        pathMatch: 'full'
    }
] as Routes;
