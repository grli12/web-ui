/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable, TemplateRef} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {AttributeTypeModalComponent} from './attribute-type/attribute-type-modal.component';
import {AppState} from '../../core/store/app.state';
import {selectServiceLimitsByWorkspace} from '../../core/store/organizations/service-limits/service-limits.state';
import {first, map, mergeMap, take} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {userHasManageRoleInResource} from '../utils/resource.utils';
import {Organization} from '../../core/store/organizations/organization';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {RouterAction} from '../../core/store/router/router.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AttributeFunctionModalComponent} from './attribute-function/attribute-function-modal.component';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {selectLinkTypeById} from '../../core/store/link-types/link-types.state';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {CreateLinkModalComponent} from './create-link/create-link-modal.component';
import {View} from '../../core/store/views/view';
import {ShareViewModalComponent} from './share-view/share-view-modal.component';
import {AttributesResource, DataResource} from '../../core/model/resource';
import {DataResourceDetailModalComponent} from './data-resource-detail/data-resource-detail-modal.component';
import {ChooseLinkDocumentModalComponent} from './choose-link-document/choose-link-document-modal.component';
import {DocumentModel} from '../../core/store/documents/document.model';
import {ToastrService} from 'ngx-toastr';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {NavigationExtras} from '@angular/router';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {CreateProjectModalComponent} from './create-project/create-project-modal.component';
import {CopyProjectModalComponent} from './copy-project/copy-project-modal.component';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalRefs: BsModalRef[] = [];

  constructor(
    private store$: Store<AppState>,
    private i18n: I18n,
    private bsModalService: BsModalService,
    private toastrService: ToastrService
  ) {}

  public show(content: string | TemplateRef<any> | any, config?: ModalOptions): BsModalRef {
    return this.addModalRef(this.bsModalService.show(content, config));
  }

  public showChooseLinkDocument(documentIds: string[], callback?: (document: DocumentModel) => void): BsModalRef {
    const config = {initialState: {documentIds, callback}, keyboard: true, class: 'modal-lg'};
    return this.addModalRef(this.bsModalService.show(ChooseLinkDocumentModalComponent, config));
  }

  public showDocumentDetail(id: string) {
    this.store$
      .pipe(
        select(selectDocumentById(id)),
        mergeMap(document =>
          this.store$.pipe(
            select(selectCollectionById(document?.collectionId)),
            map(collection => ({collection, document}))
          )
        ),
        take(1)
      )
      .subscribe(({document, collection}) => {
        if (document && collection) {
          this.showDataResourceDetail(document, collection);
        }
      });
  }

  public showLinkInstanceDetail(id: string) {
    this.store$
      .pipe(
        select(selectLinkInstanceById(id)),
        mergeMap(linkInstance =>
          this.store$.pipe(
            select(selectLinkTypeById(linkInstance?.linkTypeId)),
            map(linkType => ({linkType, linkInstance: linkInstance}))
          )
        ),
        take(1)
      )
      .subscribe(({linkType, linkInstance}) => {
        if (linkInstance && linkType) {
          this.showDataResourceDetail(linkInstance, linkType);
        }
      });
  }

  public showDataResourceDetail(
    dataResource: DataResource,
    resource: AttributesResource,
    createDirectly: boolean = true
  ): BsModalRef {
    const config = {
      initialState: {dataResource, resource, createDirectly},
      keyboard: true,
      class: 'modal-lg',
    };
    return this.addModalRef(this.bsModalService.show(DataResourceDetailModalComponent, config));
  }

  public showShareView(view: View): BsModalRef {
    const initialState = {view};
    return this.showStaticDialog(initialState, ShareViewModalComponent, 'modal-lg');
  }

  public showCreateLink(collections: Collection[], callback?: (linkType: LinkType) => void): BsModalRef {
    const initialState = {collections, callback};
    return this.showStaticDialog(initialState, CreateLinkModalComponent);
  }

  public showAttributeType(attributeId: string, collectionId: string, linkTypeId?: string): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId};
    return this.showStaticDialog(initialState, AttributeTypeModalComponent);
  }

  public showStaticDialog(
    initialState: any,
    content: string | TemplateRef<any> | any,
    classString: string = ''
  ): BsModalRef {
    const config = {initialState, keyboard: false, class: classString};
    config['backdrop'] = 'static';
    return this.addModalRef(this.bsModalService.show(content, config));
  }

  private addModalRef(modalRef: BsModalRef): BsModalRef {
    this.modalRefs.push(modalRef);
    return modalRef;
  }

  public showAttributeFunction(attributeId: string, collectionId: string, linkTypeId?: string) {
    const attributesResourceObservable =
      (collectionId && this.store$.pipe(select(selectCollectionById(collectionId)))) ||
      this.store$.pipe(select(selectLinkTypeById(linkTypeId)));

    combineLatest([this.store$.pipe(select(selectServiceLimitsByWorkspace)), attributesResourceObservable])
      .pipe(first())
      .subscribe(([limits, attributesResource]) => {
        const functions = (attributesResource.attributes || []).filter(
          attr => attr.id !== attributeId && !!attr.function?.js
        ).length;
        if (limits?.functionsPerCollection !== -1 && functions >= limits?.functionsPerCollection) {
          this.notifyFunctionsLimit();
        } else {
          this.showAttributeFunctionDialog(attributeId, collectionId, linkTypeId);
        }
      });
  }

  private showAttributeFunctionDialog(attributeId: string, collectionId: string, linkTypeId: string): BsModalRef {
    const initialState = {attributeId, collectionId, linkTypeId};
    const config = {initialState, keyboard: false, class: 'modal-xxl'};
    config['backdrop'] = 'static';
    return this.addModalRef(this.bsModalService.show(AttributeFunctionModalComponent, config));
  }

  private notifyFunctionsLimit() {
    combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectOrganizationByWorkspace)),
    ])
      .pipe(take(1))
      .subscribe(([currentUser, organization]) => {
        if (userHasManageRoleInResource(currentUser, organization)) {
          this.notifyFunctionsLimitWithRedirect(organization);
        } else {
          this.notifyFunctionsLimitWithoutRights();
        }
      });
  }

  private notifyFunctionsLimitWithRedirect(organization: Organization) {
    const message = this.i18n({
      id: 'function.create.serviceLimits',
      value:
        'You can have only a single function per table/link type in the Free Plan. Do you want to upgrade to Business now?',
    });
    this.store$.dispatch(new OrganizationsAction.OfferPayment({message, organizationCode: organization.code}));
  }

  private notifyFunctionsLimitWithoutRights() {
    const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
    const message = this.i18n({
      id: 'function.create.serviceLimits.noRights',
      value: 'You can have only a single function per table/link type in the Free Plan.',
    });
    this.store$.dispatch(new NotificationsAction.Info({title, message}));
  }

  public showCreateProjectDialog(
    organizations: Organization[],
    templateCode: string,
    extras?: NavigationExtras
  ): BsModalRef {
    this.store$.dispatch(new ProjectsAction.GetTemplates());
    const initialState = {
      templateCode,
      organizations,
      navigationExtras: extras,
    };
    return this.showStaticDialog(initialState, CreateProjectModalComponent, 'modal-xxl modal-xxl-height');
  }

  public showCopyProjectDialog(
    organizations: Organization[],
    organizationId: string,
    projectId: string,
    extras?: NavigationExtras
  ): BsModalRef {
    const initialState = {
      organizations,
      organizationId,
      projectId,
      navigationExtras: extras,
    };
    return this.showStaticDialog(initialState, CopyProjectModalComponent, 'modal-lg');
  }

  public destroy() {
    this.modalRefs.forEach(ref => ref?.hide());
    this.toastrService.toasts.forEach(toast => toast.toastRef.close());
  }
}
