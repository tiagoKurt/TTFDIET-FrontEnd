import { Routes } from '@angular/router';

export default [
    {
        path: 'diario',
        loadComponent: () => import('./diario/planejamento-diario.component').then(m => m.PlanejamentoDiarioComponent)
    },
    {
        path: 'semanal',
        loadComponent: () => import('./semanal/planejamento-semanal.component').then(m => m.PlanejamentoSemanalComponent)
    },
    {
        path: '',
        redirectTo: 'diario',
        pathMatch: 'full'
    }
] as Routes;
