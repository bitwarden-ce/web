import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { UserService } from 'jslib/abstractions/user.service';

@Component({
    selector: 'app-org-settings',
    templateUrl: 'settings.component.html',
})
export class SettingsComponent {
    constructor(private route: ActivatedRoute, private userService: UserService,
        private platformUtilsService: PlatformUtilsService) { }

    ngOnInit() {
        this.route.parent.params.subscribe(async (params) => {
            const organization = await this.userService.getOrganization(params.organizationId);
        });
    }
}
