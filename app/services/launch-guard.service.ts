import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RouterExtensions } from "nativescript-angular/router";

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { UserService } from 'jslib/abstractions/user.service';

@Injectable()
export class LaunchGuardService implements CanActivate {
    constructor(private cryptoService: CryptoService, private userService: UserService,
        private routerExtensions: RouterExtensions) { }

    async canActivate() {
        const isAuthed = await this.userService.isAuthenticated();
        if (!isAuthed) {
            return true;
        }

        const hasKey = await this.cryptoService.hasKey();
        if (!hasKey) {
            this.routerExtensions.navigate(['lock']);
        } else {
            this.routerExtensions.navigate(['tabs']);
        }

        return false;
    }
}
