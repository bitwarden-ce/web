import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { Router } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { ApiService, CryptoService, I18nService, SyncService } from 'jslib/abstractions';
import { OrganizationCreateRequest } from 'jslib/models/request/organizationCreateRequest';

@Component({
    selector: 'app-create-organization',
    templateUrl: 'create-organization.component.html',
})
export class CreateOrganizationComponent {
    @Input() showCancel = false;
    @Output() onSuccess = new EventEmitter();
    @Output() onCanceled = new EventEmitter();

    name: string;
    businessOwned: boolean = false;
    businessName: string;

    formPromise: Promise<any>;

    constructor(private apiService: ApiService, private i18nService: I18nService,
        private toasterService: ToasterService, private cryptoService: CryptoService,
        private syncService: SyncService, private router: Router) {}

    async submit() {
        this.formPromise = this.doSubmit();
        await this.formPromise;
        this.onSuccess.emit();
    }

    cancel() {
        this.onCanceled.emit();
    }

    private async doSubmit() {
        const shareKey = await this.cryptoService.makeShareKey();
        const ownerKey = shareKey[0].encryptedString;
        const collection = await this.cryptoService.encrypt(
            this.i18nService.t('defaultCollection'), shareKey[1],
        );
        const collectionKey = collection.encryptedString;

        const request = new OrganizationCreateRequest();
        request.key = ownerKey;
        request.collectionName = collectionKey;
        request.name = this.name;
        request.businessName = this.businessName;

        const response = await this.apiService.postOrganization(request);
        const organizationId = response.id;

        if (organizationId != null) {
            await this.apiService.refreshIdentityToken();
            await this.syncService.fullSync(true);

            this.toasterService.popAsync('success',
                this.i18nService.t('organizationCreated'),
                this.i18nService.t('organizationReadyToGo'),
            )

            this.router.navigate(['/organizations/' + organizationId]);
        }
    }
}
