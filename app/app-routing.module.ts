import { NgModule } from '@angular/core';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { Routes } from '@angular/router';

import { TabsComponent } from './tabs.component';

import { HomeComponent } from './accounts/home.component';
import { LoginComponent } from './accounts/login.component';
import { RegisterComponent } from './accounts/register.component';

import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';
import { VaultComponent } from './vault/vault.component';

import { LaunchGuardService } from './services/launch-guard.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, canActivate: [LaunchGuardService] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'tabs',
        component: TabsComponent,
        children: [
            {
                path: 'vault',
                component: VaultComponent,
                children: [
                    { path: 'groupings', component: GroupingsComponent },
                    { path: 'ciphers/:id', component: CiphersComponent },
                ],
            },
        ],
    },
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }