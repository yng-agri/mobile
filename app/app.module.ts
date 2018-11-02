import {
    NgModule,
    NO_ERRORS_SCHEMA,
} from '@angular/core';

import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { ModalDialogService } from 'nativescript-angular/modal-dialog';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';

import { AppComponent } from './app.component';
import { ModalComponent } from './modal.component';
import { TabsComponent } from './tabs.component';

import { EnvironmentComponent } from './accounts/environment.component';
import { HintComponent } from './accounts/hint.component';
import { HomeComponent } from './accounts/home.component';
import { LockComponent } from './accounts/lock.component';
import { LoginComponent } from './accounts/login.component';
import { RegisterComponent } from './accounts/register.component';

import { AppRoutingModule } from './app-routing.module';
import { ServicesModule } from './services/services.module';

import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';


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
        ModalComponent,
        TabsComponent,
        GroupingsComponent,
        CiphersComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        EnvironmentComponent,
        HintComponent,
        LockComponent,
    ],
    providers: [
        ModalDialogService,
    ],
    entryComponents: [
        ModalComponent,
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})

export class AppModule { }
