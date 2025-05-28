import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';

export const CompletedPreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    return userService.user$.pipe(
        take(1),
        map(user => {
            if (state.url === '/pre-register') {
                return true;
            }

            if (!user || user.preRegister === false) {
                router.navigate(['/pre-register']);
                return false;
            }

            return true;
        })
    );
};
