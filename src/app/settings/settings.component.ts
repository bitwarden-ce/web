import {
    Component,
    NgZone,
    OnDestroy,
} from '@angular/core';

import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { TokenService } from 'jslib/abstractions/token.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

const BroadcasterSubscriptionId = 'SettingsComponent';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
})
export class SettingsComponent implements OnDestroy {
    constructor(private tokenService: TokenService, private broadcasterService: BroadcasterService,
        private ngZone: NgZone, private platformUtilsService: PlatformUtilsService) { }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }
}
