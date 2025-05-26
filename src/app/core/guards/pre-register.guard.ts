import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { UserService } from 'app/core/user/user.service';

export const PreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    return userService.user$.pipe(
        map(user => {
            // Se o usuário já completou o pré-registro, redireciona para o home
            if (user && user.preRegister === true) {
                router.navigate(['/home']);
                return false;
            }

            // Se o usuário não completou o pré-registro, permite acesso à tela
            return true;
        })
    );
};
