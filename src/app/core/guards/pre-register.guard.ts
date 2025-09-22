import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { map, take } from 'rxjs/operators';

export const PreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    console.log('PreRegisterGuard executado para URL:', state.url);

    return userService.user$.pipe(
        take(1),
        map((user) => {
            console.log('PreRegisterGuard - User:', user);
            console.log(
                'PreRegisterGuard - preRegister status:',
                user?.preRegister
            );

            if (state.url === '/home') {
                console.log('PreRegisterGuard - Permitindo acesso ao /home');
                return true;
            }

            if (user && user.preRegister === true) {
                console.log(
                    'PreRegisterGuard - Usuário já completou pré-registro, redirecionando para /home'
                );
                router.navigate(['/home']);
                return false;
            }

            console.log('PreRegisterGuard - Permitindo acesso');
            return true;
        })
    );
};
