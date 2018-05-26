import {
    Component,
    OnInit,
} from "@angular/core";

import { LoginComponent as BaseLoginComponent } from 'jslib/angular/components/login.component';

@Component({
    selector: "app-login",
    moduleId: module.id,
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    ngOnInit(): void {
        
    }
}