import {
    Component,
} from '@angular/core';

import { MessagingService } from 'jslib/abstractions/messaging.service';
import { UserService } from 'jslib/abstractions/user.service';

@Component({
    selector: 'app-tools',
    templateUrl: 'tools.component.html',
})
export class ToolsComponent {
    constructor(private userService: UserService, private messagingService: MessagingService) { }
}
