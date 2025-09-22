import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { CompletedPreRegisterGuard } from 'app/core/guards/completed-pre-register.guard';
import { PreRegisterGuard } from 'app/core/guards/pre-register.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/home'
    { path: '', pathMatch: 'full', redirectTo: 'home' },

    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'home' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'confirmation-required',
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-required/confirmation-required.routes'
                    ),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.routes'
                    ),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.routes'
                    ),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.routes'),
            },
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.routes'),
            },
            {
                path: 'auth/callback',
                loadChildren: () =>
                    import('app/modules/auth/callback/callback.routes'),
            },
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty',
        },
        children: [
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.routes'),
            },
            {
                path: 'unlock-session',
                loadChildren: () =>
                    import(
                        'app/modules/auth/unlock-session/unlock-session.routes'
                    ),
            },
            {
                path: 'pre-register',
                canActivate: [PreRegisterGuard],
                loadChildren: () =>
                    import('app/modules/User/pre-register/pre-register.routes'),
            },
        ],
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard, CompletedPreRegisterGuard],
        canActivateChild: [AuthGuard, CompletedPreRegisterGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },

        children: [
            {
                path: 'home',
                loadChildren: () => import('app/modules/home/home.routes'),
            },
            {
                path: 'metas',
                loadChildren: () => import('app/modules/metas/metas.routes'),
            },
            {
                path: 'profile',
                loadChildren: () =>
                    import('app/modules/User/profile/profile.routes'),
            },
            {
                path: 'refeicoes/adicionar',
                loadChildren: () =>
                    import(
                        'app/modules/refeicoes/adicionar/adicionar-refeicao.routes'
                    ),
            },
            {
                path: 'refeicoes/historico',
                loadChildren: () =>
                    import(
                        'app/modules/refeicoes/plano-alimentar/plano-alimentar.routes'
                    ),
            },
            {
                path: 'planejamento/minhas-refeicoes',
                loadChildren: () =>
                    import(
                        'app/modules/refeicoes/minhas-refeicoes/minhas-refeicoes.routes'
                    ),
            },
            {
                path: 'planejamento',
                loadChildren: () =>
                    import('app/modules/planejamento/planejamento.routes'),
            },
        ],
    },
];
