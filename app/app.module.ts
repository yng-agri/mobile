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

import { CipherComponent } from './components/cipher.component';
import { IconComponent } from './components/icon.component';

import { EnvironmentComponent } from './accounts/environment.component';
import { HintComponent } from './accounts/hint.component';
import { HomeComponent } from './accounts/home.component';
import { LockComponent } from './accounts/lock.component';
import { LoginComponent } from './accounts/login.component';
import { RegisterComponent } from './accounts/register.component';

import { AppRoutingModule } from './app-routing.module';
import { ServicesModule } from './services/services.module';

import { AddEditComponent } from './vault/add-edit.component';
import { CiphersComponent } from './vault/ciphers.component';
import { GroupingsComponent } from './vault/groupings.component';
import { ViewComponent } from './vault/view.component';


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
        AddEditComponent,
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
        ViewComponent,
        CipherComponent,
        IconComponent,
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
