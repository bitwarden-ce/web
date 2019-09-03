import {
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { ToasterService } from 'angular2-toaster';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherView } from 'jslib/models/view/cipherView';

import { ModalComponent } from '../modal.component';

import { OrganizationsComponent } from '../settings/organizations.component';
import { UpdateKeyComponent } from '../settings/update-key.component';
import { AddEditComponent } from './add-edit.component';
import { AttachmentsComponent } from './attachments.component';
import { BulkDeleteComponent } from './bulk-delete.component';
import { BulkMoveComponent } from './bulk-move.component';
import { BulkShareComponent } from './bulk-share.component';
import { CiphersComponent } from './ciphers.component';
import { CollectionsComponent } from './collections.component';
import { FolderAddEditComponent } from './folder-add-edit.component';
import { GroupingsComponent } from './groupings.component';
import { ShareComponent } from './share.component';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { TokenService } from 'jslib/abstractions/token.service';
import { UserService } from 'jslib/abstractions/user.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

const BroadcasterSubscriptionId = 'VaultComponent';

@Component({
    selector: 'app-vault',
    templateUrl: 'vault.component.html',
})
export class VaultComponent implements OnInit, OnDestroy {
    @ViewChild(GroupingsComponent) groupingsComponent: GroupingsComponent;
    @ViewChild(CiphersComponent) ciphersComponent: CiphersComponent;
    @ViewChild(OrganizationsComponent) organizationsComponent: OrganizationsComponent;
    @ViewChild('attachments', { read: ViewContainerRef }) attachmentsModalRef: ViewContainerRef;
    @ViewChild('folderAddEdit', { read: ViewContainerRef }) folderAddEditModalRef: ViewContainerRef;
    @ViewChild('cipherAddEdit', { read: ViewContainerRef }) cipherAddEditModalRef: ViewContainerRef;
    @ViewChild('share', { read: ViewContainerRef }) shareModalRef: ViewContainerRef;
    @ViewChild('collections', { read: ViewContainerRef }) collectionsModalRef: ViewContainerRef;
    @ViewChild('bulkDeleteTemplate', { read: ViewContainerRef }) bulkDeleteModalRef: ViewContainerRef;
    @ViewChild('bulkMoveTemplate', { read: ViewContainerRef }) bulkMoveModalRef: ViewContainerRef;
    @ViewChild('bulkShareTemplate', { read: ViewContainerRef }) bulkShareModalRef: ViewContainerRef;
    @ViewChild('updateKeyTemplate', { read: ViewContainerRef }) updateKeyModalRef: ViewContainerRef;

    favorites: boolean = false;
    type: CipherType = null;
    folderId: string = null;
    collectionId: string = null;
    showVerifyEmail = false;
    showBrowserOutdated = false;
    showUpdateKey = false;

    private modal: ModalComponent = null;

    constructor(private syncService: SyncService, private route: ActivatedRoute,
        private router: Router, private changeDetectorRef: ChangeDetectorRef,
        private i18nService: I18nService, private componentFactoryResolver: ComponentFactoryResolver,
        private tokenService: TokenService, private cryptoService: CryptoService,
        private messagingService: MessagingService, private userService: UserService,
        private platformUtilsService: PlatformUtilsService, private toasterService: ToasterService,
        private broadcasterService: BroadcasterService, private ngZone: NgZone) { }

    async ngOnInit() {
        this.showVerifyEmail = !(await this.tokenService.getEmailVerified());
        this.showBrowserOutdated = window.navigator.userAgent.indexOf('MSIE') !== -1;

        const queryParamsSub = this.route.queryParams.subscribe(async (params) => {
            await this.syncService.fullSync(false);

            this.showUpdateKey = !(await this.cryptoService.hasEncKey());

            await Promise.all([
                this.groupingsComponent.load(),
                this.organizationsComponent.load(),
            ]);

            if (params == null) {
                this.groupingsComponent.selectedAll = true;
                await this.ciphersComponent.reload();
            } else {
                if (params.favorites) {
                    this.groupingsComponent.selectedFavorites = true;
                    await this.filterFavorites();
                } else if (params.type) {
                    const t = parseInt(params.type, null);
                    this.groupingsComponent.selectedType = t;
                    await this.filterCipherType(t);
                } else if (params.folderId) {
                    this.groupingsComponent.selectedFolder = true;
                    this.groupingsComponent.selectedFolderId = params.folderId;
                    await this.filterFolder(params.folderId);
                } else if (params.collectionId) {
                    this.groupingsComponent.selectedCollectionId = params.collectionId;
                    await this.filterCollection(params.collectionId);
                } else {
                    this.groupingsComponent.selectedAll = true;
                    await this.ciphersComponent.reload();
                }
            }

            this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
                this.ngZone.run(async () => {
                    switch (message.command) {
                        case 'syncCompleted':
                            if (message.successfully) {
                                await Promise.all([
                                    this.groupingsComponent.load(),
                                    this.organizationsComponent.load(),
                                    this.ciphersComponent.load(this.ciphersComponent.filter),
                                ]);
                                this.changeDetectorRef.detectChanges();
                            }
                            break;
                    }
                });
            });

            if (queryParamsSub != null) {
                queryParamsSub.unsubscribe();
            }
        });
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async clearGroupingFilters() {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchVault');
        await this.ciphersComponent.reload();
        this.clearFilters();
        this.go();
    }

    async filterFavorites() {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchFavorites');
        await this.ciphersComponent.reload((c) => c.favorite);
        this.clearFilters();
        this.favorites = true;
        this.go();
    }

    async filterCipherType(type: CipherType) {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchType');
        await this.ciphersComponent.reload((c) => c.type === type);
        this.clearFilters();
        this.type = type;
        this.go();
    }

    async filterFolder(folderId: string) {
        this.ciphersComponent.showAddNew = true;
        folderId = folderId === 'none' ? null : folderId;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchFolder');
        await this.ciphersComponent.reload((c) => c.folderId === folderId);
        this.clearFilters();
        this.folderId = folderId == null ? 'none' : folderId;
        this.go();
    }

    async filterCollection(collectionId: string) {
        this.ciphersComponent.showAddNew = true;
        this.groupingsComponent.searchPlaceholder = this.i18nService.t('searchCollection');
        await this.ciphersComponent.reload((c) => c.collectionIds != null &&
            c.collectionIds.indexOf(collectionId) > -1);
        this.clearFilters();
        this.collectionId = collectionId;
        this.go();
    }

    filterSearchText(searchText: string) {
        this.ciphersComponent.searchText = searchText;
        this.ciphersComponent.search(200);
    }

    async editCipherAttachments(cipher: CipherView) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.attachmentsModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<AttachmentsComponent>(AttachmentsComponent, this.attachmentsModalRef);

        childComponent.cipherId = cipher.id;
        let madeAttachmentChanges = false;
        childComponent.onUploadedAttachment.subscribe(() => madeAttachmentChanges = true);
        childComponent.onDeletedAttachment.subscribe(() => madeAttachmentChanges = true);
        childComponent.onReuploadedAttachment.subscribe(() => madeAttachmentChanges = true);

        this.modal.onClosed.subscribe(async () => {
            this.modal = null;
            if (madeAttachmentChanges) {
                await this.ciphersComponent.refresh();
            }
            madeAttachmentChanges = false;
        });
    }

    shareCipher(cipher: CipherView) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.shareModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<ShareComponent>(ShareComponent, this.shareModalRef);

        childComponent.cipherId = cipher.id;
        childComponent.onSharedCipher.subscribe(async () => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(async () => {
            this.modal = null;
        });
    }

    editCipherCollections(cipher: CipherView) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.collectionsModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<CollectionsComponent>(CollectionsComponent, this.collectionsModalRef);

        childComponent.cipherId = cipher.id;
        childComponent.onSavedCollections.subscribe(async () => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(async () => {
            this.modal = null;
        });
    }

    async addFolder() {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.folderAddEditModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<FolderAddEditComponent>(
            FolderAddEditComponent, this.folderAddEditModalRef);

        childComponent.folderId = null;
        childComponent.onSavedFolder.subscribe(async () => {
            this.modal.close();
            await this.groupingsComponent.loadFolders();
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    async editFolder(folderId: string) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.folderAddEditModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<FolderAddEditComponent>(
            FolderAddEditComponent, this.folderAddEditModalRef);

        childComponent.folderId = folderId;
        childComponent.onSavedFolder.subscribe(async () => {
            this.modal.close();
            await this.groupingsComponent.loadFolders();
        });
        childComponent.onDeletedFolder.subscribe(async () => {
            this.modal.close();
            await this.groupingsComponent.loadFolders();
            await this.filterFolder('none');
            this.groupingsComponent.selectedFolderId = null;
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    addCipher() {
        const component = this.editCipher(null);
        component.type = this.type;
        component.folderId = this.folderId === 'none' ? null : this.folderId;
        if (this.collectionId != null) {
            const collection = this.groupingsComponent.collections.filter((c) => c.id === this.collectionId);
            if (collection.length > 0) {
                component.organizationId = collection[0].organizationId;
                component.collectionIds = [this.collectionId];
            }
        }
    }

    editCipher(cipher: CipherView) {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.cipherAddEditModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<AddEditComponent>(
            AddEditComponent, this.cipherAddEditModalRef);

        childComponent.cipherId = cipher == null ? null : cipher.id;
        childComponent.onSavedCipher.subscribe(async (c: CipherView) => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });
        childComponent.onDeletedCipher.subscribe(async (c: CipherView) => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });

        return childComponent;
    }

    bulkDelete() {
        const selectedIds = this.ciphersComponent.getSelectedIds();
        if (selectedIds.length === 0) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nothingSelected'));
            return;
        }

        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.bulkDeleteModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<BulkDeleteComponent>(BulkDeleteComponent, this.bulkDeleteModalRef);

        childComponent.cipherIds = selectedIds;
        childComponent.onDeleted.subscribe(async () => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    bulkShare() {
        const selectedCiphers = this.ciphersComponent.getSelected();
        if (selectedCiphers.length === 0) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nothingSelected'));
            return;
        }

        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.bulkShareModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<BulkShareComponent>(BulkShareComponent, this.bulkShareModalRef);

        childComponent.ciphers = selectedCiphers;
        childComponent.onShared.subscribe(async () => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(async () => {
            this.modal = null;
        });
    }

    bulkMove() {
        const selectedIds = this.ciphersComponent.getSelectedIds();
        if (selectedIds.length === 0) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nothingSelected'));
            return;
        }

        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.bulkMoveModalRef.createComponent(factory).instance;
        const childComponent = this.modal.show<BulkMoveComponent>(BulkMoveComponent, this.bulkMoveModalRef);

        childComponent.cipherIds = selectedIds;
        childComponent.onMoved.subscribe(async () => {
            this.modal.close();
            await this.ciphersComponent.refresh();
        });

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    selectAll(select: boolean) {
        this.ciphersComponent.selectAll(select);
    }

    updateKey() {
        if (this.modal != null) {
            this.modal.close();
        }

        const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
        this.modal = this.updateKeyModalRef.createComponent(factory).instance;
        this.modal.show<UpdateKeyComponent>(UpdateKeyComponent, this.updateKeyModalRef);

        this.modal.onClosed.subscribe(() => {
            this.modal = null;
        });
    }

    private clearFilters() {
        this.folderId = null;
        this.collectionId = null;
        this.favorites = false;
        this.type = null;
    }

    private go(queryParams: any = null) {
        if (queryParams == null) {
            queryParams = {
                favorites: this.favorites ? true : null,
                type: this.type,
                folderId: this.folderId,
                collectionId: this.collectionId,
            };
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            replaceUrl: true,
        });
    }
}
