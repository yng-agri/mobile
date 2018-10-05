import {
    Component,
    OnInit,
} from '@angular/core';

@Component({
    selector: 'app-groupings',
    moduleId: module.id,
    templateUrl: './groupings.component.html',
})
export class GroupingsComponent implements OnInit {
    groupings: any[] = [];

    constructor() { }

    ngOnInit(): void {
        const groupings: any[] = [];
        for (let i = 0; i < 20; i++) {
            groupings.push({ id: i, name: 'Folder #' + (i + 1) });
        }
        this.groupings = groupings;
    }
}