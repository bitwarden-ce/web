import {
    Component,
    OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UserService } from 'jslib/abstractions/user.service';

import { Organization } from 'jslib/models/domain/organization';

@Component({
    selector: 'app-org-manage',
    templateUrl: 'manage.component.html',
})
export class ManageComponent implements OnInit {
    organization: Organization;

    constructor(private route: ActivatedRoute, private userService: UserService) { }

    ngOnInit() {
        this.route.parent.params.subscribe(async (params) => {
            this.organization = await this.userService.getOrganization(params.organizationId);
        });
    }
}
