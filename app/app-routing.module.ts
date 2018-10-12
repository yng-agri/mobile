import { NgModule } from '@angular/core';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { Routes } from '@angular/router';

import { TabsComponent } from './tabs.component';

import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';
import { VaultComponent } from './vault/vault.component';

const routes: Routes = [
    { path: '', redirectTo: '/tabs', pathMatch: 'full' },
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