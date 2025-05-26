import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { UserService } from 'app/core/user/user.service';

export const CompletedPreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    return userService.user$.pipe(
        map(user => {
            // Se o usuário não completou o pré-registro, redireciona para a tela de pré-registro
            if (user && user.preRegister === false) {
                router.navigate(['/pre-register']);
                return false;
            }

            // Se o usuário completou o pré-registro, permite acesso
            return true;
        })
    );
};
