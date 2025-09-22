import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { map, take } from 'rxjs/operators';

export const CompletedPreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    console.log('CompletedPreRegisterGuard executado para URL:', state.url);

    return userService.user$.pipe(
        take(1),
        map((user) => {
            console.log('CompletedPreRegisterGuard - User:', user);
            console.log(
                'CompletedPreRegisterGuard - preRegister status:',
                user?.preRegister
            );

            if (state.url === '/pre-register') {
                console.log(
                    'CompletedPreRegisterGuard - Permitindo acesso ao /pre-register'
                );
                return true;
            }

            if (!user || user.preRegister === false) {
                console.log(
                    'CompletedPreRegisterGuard - Usuário precisa completar pré-registro, redirecionando para /pre-register'
                );
                router.navigate(['/pre-register']);
                return false;
            }

            console.log('CompletedPreRegisterGuard - Permitindo acesso');
            return true;
        })
    );
};
