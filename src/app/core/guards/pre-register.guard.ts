import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';

export const PreRegisterGuard: CanActivateFn = (route, state) => {
    const userService = inject(UserService);
    const router = inject(Router);

    return userService.user$.pipe(
        take(1),
        map(user => {
            if (state.url === '/home') {
                return true;
            }

            if (user && user.preRegister === true) {
                router.navigate(['/home']);
                return false;
            }

            return true;
        })
    );
};
