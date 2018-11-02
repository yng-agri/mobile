import { NgModule } from '@angular/core';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { Routes } from '@angular/router';

import { TabsComponent } from './tabs.component';

import { EnvironmentComponent } from './accounts/environment.component';
import { HintComponent } from './accounts/hint.component';
import { HomeComponent } from './accounts/home.component';
import { LockComponent } from './accounts/lock.component';
import { LoginComponent } from './accounts/login.component';
import { RegisterComponent } from './accounts/register.component';

import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';

import { LaunchGuardService } from './services/launch-guard.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LaunchGuardService],
        children: [
            {
                path: 'login', component: LoginComponent,
                children: [
                    { path: 'hint', component: HintComponent },
                ],
            },
            { path: 'register', component: RegisterComponent },
            { path: 'environment', component: EnvironmentComponent },
        ],
    },
    { path: 'lock', component: LockComponent },
    {
        path: 'tabs',
        component: TabsComponent,
        children: [
            { path: 'groupings', component: GroupingsComponent, outlet: 'vaultTab' },
            { path: 'ciphers/:id', component: CiphersComponent, outlet: 'vaultTab' },
        ],
    },
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }