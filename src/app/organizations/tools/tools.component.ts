import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Organization } from 'jslib/models/domain/organization';

import { MessagingService } from 'jslib/abstractions/messaging.service';
import { UserService } from 'jslib/abstractions/user.service';

@Component({
    selector: 'app-org-tools',
    templateUrl: 'tools.component.html',
})
export class ToolsComponent {
    organization: Organization;

    constructor(private route: ActivatedRoute, private userService: UserService,
        private messagingService: MessagingService) { }

    ngOnInit() {
        this.route.parent.params.subscribe(async (params) => {
            this.organization = await this.userService.getOrganization(params.organizationId);
        });
    }

    upgradeOrganization() {
        this.messagingService.send('upgradeOrganization', { organizationId: this.organization.id });
    }
}
