import {
    NgModule,
    NO_ERRORS_SCHEMA,
} from '@angular/core';

import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';

import { AppComponent } from './app.component';
import { TabsComponent } from './tabs.component';

import { AppRoutingModule } from './app-routing.module';
import { ServicesModule } from './services/services.module';

import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';
import { VaultComponent } from './vault/vault.component';


@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptFormsModule,
        NativeScriptModule,
        AppRoutingModule,
        ServicesModule
    ],
    declarations: [
        AppComponent,
        TabsComponent,
        GroupingsComponent,
        CiphersComponent,
        VaultComponent,
    ],
    providers: [],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})

export class AppModule { }
