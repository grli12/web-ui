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

import {Injectable, OnDestroy} from '@angular/core';
import {select, Store} from '@ngrx/store';
import Pusher from 'pusher-js';
import {of, timer} from 'rxjs';
import {catchError, filter, first, map, take, tap, withLatestFrom} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthService} from '../../auth/auth.service';
import {userHasManageRoleInResource} from '../../shared/utils/resource.utils';
import {OrganizationDto, ProjectDto} from '../dto';
import {ResourceType} from '../model/resource-type';
import {AppState} from '../store/app.state';
import {convertCollectionDtoToModel} from '../store/collections/collection.converter';
import {CollectionsAction} from '../store/collections/collections.action';
import {selectCollectionsDictionary} from '../store/collections/collections.state';
import {selectWorkspaceModels} from '../store/common/common.selectors';
import {convertDocumentDtoToModel} from '../store/documents/document.converter';
import {DocumentsAction} from '../store/documents/documents.action';
import {selectDocumentById} from '../store/documents/documents.state';
import {convertLinkInstanceDtoToModel} from '../store/link-instances/link-instance.converter';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';
import {selectLinkInstanceById} from '../store/link-instances/link-instances.state';
import {convertLinkTypeDtoToModel} from '../store/link-types/link-type.converter';
import {LinkTypesAction} from '../store/link-types/link-types.action';
import {selectLinkTypeById, selectLinkTypesDictionary} from '../store/link-types/link-types.state';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {ContactConverter} from '../store/organizations/contact/contact.converter';
import {ContactsAction} from '../store/organizations/contact/contacts.action';
import {Organization} from '../store/organizations/organization';
import {OrganizationConverter} from '../store/organizations/organization.converter';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {selectOrganizationsDictionary} from '../store/organizations/organizations.state';
import {PaymentConverter} from '../store/organizations/payment/payment.converter';
import {PaymentsAction} from '../store/organizations/payment/payments.action';
import {ServiceLimitsAction} from '../store/organizations/service-limits/service-limits.action';
import {ServiceLimitsConverter} from '../store/organizations/service-limits/service-limits.converter';
import {Project} from '../store/projects/project';
import {ProjectConverter} from '../store/projects/project.converter';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectsDictionary} from '../store/projects/projects.state';
import {UserNotificationConverter} from '../store/user-notifications/user-notification.converter';
import {UserNotificationsAction} from '../store/user-notifications/user-notifications.action';
import {User} from '../store/users/user';
import {convertUserDtoToModel} from '../store/users/user.converter';
import {UsersAction} from '../store/users/users.action';
import {selectCurrentUser} from '../store/users/users.state';
import {View} from '../store/views/view';
import {convertDefaultViewConfigDtoToModel, convertViewDtoToModel} from '../store/views/view.converter';
import {ViewsAction} from '../store/views/views.action';
import {selectViewsDictionary} from '../store/views/views.state';
import {SequencesAction} from '../store/sequences/sequences.action';
import {SequenceConverter} from '../store/sequences/sequence.converter';
import {OrganizationService, ProjectService} from '../data-service';

@Injectable({
  providedIn: 'root',
})
export class PusherService implements OnDestroy {
  private pusher: any;
  private channel: any;
  private currentOrganization: Organization;
  private currentProject: Project;
  private user: User;

  constructor(
    private store$: Store<AppState>,
    private authService: AuthService,
    private organizationService: OrganizationService,
    private projectService: ProjectService
  ) {}

  public init(): void {
    if (environment.auth) {
      this.subscribeToUser();
    }
    this.subscribeToWorkspace();
  }

  private subscribeToUser() {
    this.store$
      .pipe(
        select(selectCurrentUser),
        filter(user => !!user),
        take(1),
        tap(user => (this.user = user))
      )
      .subscribe(user => {
        this.subscribePusher(user);
      });
  }

  private subscribePusher(user: User): void {
    Pusher.logToConsole = !environment.pusherLogDisabled;
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster,
      authEndpoint: `${environment.apiUrl}/rest/pusher`,
      auth: {
        params: {},
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`,
        },
      },
    });

    this.channel = this.pusher.subscribe('private-' + user.id);

    this.bindOrganizationEvents();
    this.bindProjectEvents();
    this.bindViewEvents();
    this.bindCollectionEvents();
    this.bindDocumentEvents();
    this.bindLinkTypeEvents();
    this.bindLinkInstanceEvents();
    this.bindOtherEvents();
    this.bindFavoriteEvents();
    this.bindUserEvents();
    this.bindSequenceEvents();
    this.bindTemplateEvents();
  }

  private bindOrganizationEvents() {
    this.channel.bind('Organization:create', data => {
      this.store$.dispatch(new OrganizationsAction.CreateSuccess({organization: OrganizationConverter.fromDto(data)}));
    });
    this.channel.bind('Organization:create:ALT', data => {
      this.store$.dispatch(new OrganizationsAction.GetSingle({organizationId: data.id}));
    });
    this.channel.bind('Organization:update', data => {
      if (data.id === this.getCurrentOrganizationId()) {
        this.checkIfUserGainManage(data);
        this.checkIfUserLostManage(data, ResourceType.Organization);
      }
      this.getOrganization(data.id, oldOrganization => {
        const oldCode = oldOrganization && oldOrganization.code;
        this.store$.dispatch(
          new OrganizationsAction.UpdateSuccess({organization: OrganizationConverter.fromDto(data), oldCode})
        );
      });
    });
    this.channel.bind('Organization:update:ALT', data => {
      this.organizationService.getOrganization(data.id).pipe(
        filter(dto => !!dto),
        map((dto: OrganizationDto) => OrganizationConverter.fromDto(dto)),
        map((newOrganization: Organization) => {
          if (data.id === this.getCurrentOrganizationId()) {
            this.checkIfUserGainManage(newOrganization);
            this.checkIfUserLostManage(newOrganization, ResourceType.Organization);
          }
          this.getOrganization(data.id, oldOrganization => {
            const oldCode = oldOrganization && oldOrganization.code;
            this.store$.dispatch(new OrganizationsAction.UpdateSuccess({organization: newOrganization, oldCode}));
          });
        }),
        catchError(error => of(new OrganizationsAction.GetFailure({error: error})))
      );
    });
    this.channel.bind('Organization:remove', data => {
      this.getOrganization(data.id, oldOrganization => {
        const organizationCode = oldOrganization && oldOrganization.code;
        this.store$.dispatch(new OrganizationsAction.DeleteSuccess({organizationId: data.id, organizationCode}));
      });
    });
  }

  private getOrganization(id: string, action: (Organization) => void) {
    this.store$
      .pipe(
        select(selectOrganizationsDictionary),
        map(organizations => organizations[id]),
        take(1)
      )
      .subscribe(oldOrganization => action(oldOrganization));
  }

  private checkIfUserGainManage(resource: Organization | Project) {
    const hasManage = userHasManageRoleInResource(this.user, resource);
    const hadManageInOrg = userHasManageRoleInResource(this.user, this.currentOrganization);
    const hadManageInProj = userHasManageRoleInResource(this.user, this.currentProject);

    if (hasManage && !hadManageInOrg && !hadManageInProj) {
      this.store$.dispatch(new ProjectsAction.Get({organizationId: this.getCurrentOrganizationId(), force: true}));
      this.store$.dispatch(new CollectionsAction.Get({force: true}));
      this.store$.dispatch(new LinkTypesAction.Get({force: true}));
      this.store$.dispatch(new ViewsAction.Get({force: true}));
    }
  }

  private checkIfUserLostManage(resource: Organization | Project, type: ResourceType) {
    const hasManage = userHasManageRoleInResource(this.user, resource);
    const hadManageInOrg = userHasManageRoleInResource(this.user, this.currentOrganization);
    const hadManageInProj = userHasManageRoleInResource(this.user, this.currentProject);

    if (
      !hasManage &&
      hadManageInOrg !== hadManageInProj &&
      ((type === ResourceType.Organization && hadManageInOrg) || (type === ResourceType.Project && hadManageInProj))
    ) {
      this.store$.dispatch(new NotificationsAction.ForceRefresh());
    }
  }

  private bindProjectEvents() {
    this.channel.bind('Project:create', data => {
      this.store$.dispatch(
        new ProjectsAction.CreateSuccess({project: ProjectConverter.fromDto(data.object, data.organizationId)})
      );
    });
    this.channel.bind('Project:create:ALT', data => {
      this.store$.dispatch(new ProjectsAction.GetSingle({organizationId: data.organizationId, projectId: data.id}));
    });
    this.channel.bind('Project:update', data => {
      this.getProject(data.object.id, oldProject => {
        if (data.object.id === this.getCurrentProjectId()) {
          this.checkIfUserGainManage(data.object);
          this.checkIfUserLostManage(data.object, ResourceType.Project);
        }
        const oldCode = oldProject && oldProject.code;
        this.store$.dispatch(
          new ProjectsAction.UpdateSuccess({
            project: ProjectConverter.fromDto(data.object, data.organizationId),
            oldCode,
          })
        );
      });
    });
    this.channel.bind('Project:update:ALT', data => {
      this.getProject(data.id, oldProject => {
        this.projectService.getProject(data.organizationId, data.id).pipe(
          filter(projectDto => !!projectDto),
          map((dto: ProjectDto) => ProjectConverter.fromDto(dto, data.organizationId)),
          map((newProject: Project) => {
            if (data.id === this.getCurrentProjectId()) {
              this.checkIfUserGainManage(newProject);
              this.checkIfUserLostManage(newProject, ResourceType.Project);
            }
            const oldCode = oldProject && oldProject.code;
            this.store$.dispatch(new ProjectsAction.UpdateSuccess({project: newProject, oldCode}));
          }),
          catchError(error => of(new ProjectsAction.GetFailure({error: error})))
        );
      });
    });
    this.channel.bind('Project:remove', data => {
      this.getProject(data.id, oldProject => {
        const projectCode = oldProject && oldProject.code;
        this.store$.dispatch(
          new ProjectsAction.DeleteSuccess({projectId: data.id, organizationId: data.organizationId, projectCode})
        );
      });
    });
  }

  private getProject(id: string, action: (Project) => void) {
    this.store$
      .pipe(
        select(selectProjectsDictionary),
        map(projects => projects[id]),
        take(1)
      )
      .subscribe(oldProject => action(oldProject));
  }

  private bindCollectionEvents() {
    this.channel.bind('Collection:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new CollectionsAction.CreateSuccess({
            collection: convertCollectionDtoToModel(data.object, data.correlationId),
          })
        );
      }
    });
    this.channel.bind('Collection:create:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new CollectionsAction.GetSingle({
            collectionId: data.id,
          })
        );
      }
    });
    this.channel.bind('Collection:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.fetchDataIfCollectionIsNew(data.object.id);
        this.store$.dispatch(
          new CollectionsAction.UpdateSuccess({
            collection: convertCollectionDtoToModel(data.object, data.correlationId),
          })
        );
      }
    });
    this.channel.bind('Collection:update:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.fetchDataIfCollectionIsNew(data.id);
        this.store$.dispatch(
          new CollectionsAction.GetSingle({
            collectionId: data.id,
          })
        );
      }
    });
    this.channel.bind('Collection:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.DeleteSuccess({collectionId: data.id}));
      }
    });
    this.channel.bind('Collection:import', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new DocumentsAction.Get({
            query: {stems: [{collectionId: data.object.id}]},
            force: true,
          })
        );
      }
    });
    this.channel.bind('Collection:import:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new DocumentsAction.Get({
            query: {stems: [{collectionId: data.id}]},
            force: true,
          })
        );
      }
    });
    this.channel.bind('Collection:reload', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new DocumentsAction.Get({
            query: {stems: [{collectionId: data.object.id}]},
            force: true,
          })
        );
      }
    });
    this.channel.bind('Collection:reload:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new DocumentsAction.Get({
            query: {stems: [{collectionId: data.id}]},
            force: true,
          })
        );
      }
    });
  }

  private fetchDataIfCollectionIsNew(collectionId: string) {
    this.store$
      .pipe(
        select(selectCollectionsDictionary),
        map(collectionsMap => collectionsMap[collectionId]),
        take(1)
      )
      .subscribe(collection => {
        if (!collection) {
          this.store$.dispatch(new DocumentsAction.Get({query: {stems: [{collectionId}]}}));
        }
      });
  }

  private bindViewEvents() {
    this.channel.bind('View:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: convertViewDtoToModel(data.object)}));
      }
    });
    this.channel.bind('View:create:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.GetOne({viewId: data.id}));
      }
    });
    this.channel.bind('View:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.UpdateSuccess({view: convertViewDtoToModel(data.object)}));
      }
    });
    this.channel.bind('View:update:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.GetOne({viewId: data.id}));
      }
    });
    this.channel.bind('View:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.getView(data.id, (view: View) => {
          const viewCode = view && view.code;
          this.store$.dispatch(new ViewsAction.DeleteSuccess({viewId: data.id, viewCode}));
        });
      }
    });
    this.channel.bind('DefaultViewConfig:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfigSuccess({model: convertDefaultViewConfigDtoToModel(data.object)})
        );
      }
    });
  }

  private getView(id: string, action: (View) => void) {
    this.store$
      .pipe(
        select(selectViewsDictionary),
        map(views => views[id]),
        take(1)
      )
      .subscribe(view => action(view));
  }

  private bindDocumentEvents() {
    this.channel.bind('Document:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new DocumentsAction.CreateSuccess({document: convertDocumentDtoToModel(data.object, data.correlationId)})
        );
      }
    });
    this.channel.bind('Document:create:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.GetSingle({collectionId: data.extraId, documentId: data.id}));
      }
    });
    this.channel.bind('Document:update', data => {
      if (this.isCurrentWorkspace(data)) {
        const document = convertDocumentDtoToModel(data.object, data.correlationId);
        this.store$.pipe(select(selectDocumentById(document.id)), take(1)).subscribe(originalDocument =>
          this.store$.dispatch(
            new DocumentsAction.UpdateSuccess({
              document,
              originalDocument,
            })
          )
        );
      }
    });
    this.channel.bind('Document:update:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.GetSingle({collectionId: data.extraId, documentId: data.id}));
      }
    });
    this.channel.bind('Document:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.DeleteSuccess({documentId: data.id}));
      }
    });
  }

  private bindLinkTypeEvents() {
    this.channel.bind('LinkType:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkTypesAction.CreateSuccess({linkType: convertLinkTypeDtoToModel(data.object, data.correlationId)})
        );
      }
    });
    this.channel.bind('LinkType:create:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.GetSingle({linkTypeId: data.id}));
      }
    });
    this.channel.bind('LinkType:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkTypesAction.UpdateSuccess({linkType: convertLinkTypeDtoToModel(data.object, data.correlationId)})
        );
      }
    });
    this.channel.bind('LinkType:update:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.GetSingle({linkTypeId: data.id}));
      }
    });
    this.channel.bind('LinkType:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkTypesAction.DeleteSuccess({linkTypeId: data.id}));
      }
    });
  }

  private bindLinkInstanceEvents() {
    this.channel.bind('LinkInstance:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new LinkInstancesAction.CreateSuccess({
            linkInstance: convertLinkInstanceDtoToModel(data.object, data.correlationId),
          })
        );
      }
    });
    this.channel.bind('LinkInstance:create:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkInstancesAction.GetSingle({linkTypeId: data.extraId, linkInstanceId: data.id}));
      }
    });
    this.channel.bind('LinkInstance:update', data => {
      if (this.isCurrentWorkspace(data)) {
        const linkInstance = convertLinkInstanceDtoToModel(data.object, data.correlationId);
        this.store$
          .pipe(select(selectLinkInstanceById(linkInstance.id)), take(1))
          .subscribe(originalLinkInstance =>
            this.store$.dispatch(new LinkInstancesAction.UpdateSuccess({linkInstance, originalLinkInstance}))
          );
      }
    });
    this.channel.bind('LinkInstance:update:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkInstancesAction.GetSingle({linkTypeId: data.extraId, linkInstanceId: data.id}));
      }
    });
    this.channel.bind('LinkInstance:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new LinkInstancesAction.DeleteSuccess({linkInstanceId: data.id}));
      }
    });
    this.channel.bind('LinkInstance:import', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$
          .pipe(
            select(selectLinkTypeById(data.object.id)),
            map(linkType => linkType.collectionIds[0]),
            first()
          )
          .subscribe(collectionId => {
            this.store$.dispatch(
              new LinkInstancesAction.Get({
                query: {stems: [{collectionId, linkTypeIds: [data.object.id]}]},
              })
            );
          });
      }
    });
    this.channel.bind('LinkInstance:import:ALT', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$
          .pipe(
            select(selectLinkTypeById(data.id)),
            map(linkType => linkType && linkType.collectionIds[0]),
            first(),
            filter(collectionId => !!collectionId)
          )
          .subscribe(collectionId => {
            this.store$.dispatch(
              new LinkInstancesAction.Get({
                query: {stems: [{collectionId, linkTypeIds: [data.id]}]},
              })
            );
          });
      }
    });
  }

  private bindOtherEvents() {
    this.channel.bind('DocumentsAndLinks:create', data => {
      if (this.isCurrentWorkspace(data)) {
        const documentsIds: string[] = data.object.documentsIds || [];
        const linkInstancesIds: string[] = data.object.linkInstancesIds || [];
        if (documentsIds.length) {
          this.store$.dispatch(new DocumentsAction.GetByIds({documentsIds}));
        }
        if (linkInstancesIds.length) {
          this.store$.dispatch(new LinkInstancesAction.GetByIds({linkInstancesIds}));
        }
      }
    });

    this.channel.bind('CompanyContact:update', data => {
      this.store$.dispatch(new ContactsAction.SetContactSuccess({contact: ContactConverter.fromDto(data)}));
    });

    this.channel.bind('ServiceLimits:update', data => {
      this.store$.dispatch(
        new ServiceLimitsAction.GetServiceLimitsSuccess({
          serviceLimits: ServiceLimitsConverter.fromDto(data.organizationId, data.object),
        })
      );
    });

    this.channel.bind('Payment:update', data => {
      this.store$.dispatch(
        new PaymentsAction.GetPaymentSuccess({payment: PaymentConverter.fromDto(data.organizationId, data.object)})
      );
    });

    this.channel.bind('UserNotification:create', data => {
      this.store$.dispatch(
        new UserNotificationsAction.UpdateSuccess({userNotification: UserNotificationConverter.fromDto(data)})
      );
    });
    this.channel.bind('UserNotification:remove', data => {
      this.store$.dispatch(new UserNotificationsAction.DeleteSuccess({id: data.id}));
    });
  }

  private bindFavoriteEvents() {
    this.channel.bind('FavoriteDocument:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.AddFavoriteSuccess({documentId: data.id}));
      }
    });
    this.channel.bind('FavoriteDocument:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new DocumentsAction.RemoveFavoriteSuccess({documentId: data.id}));
      }
    });
    this.channel.bind('FavoriteCollection:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.AddFavoriteSuccess({collectionId: data.id}));
      }
    });
    this.channel.bind('FavoriteCollection:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new CollectionsAction.RemoveFavoriteSuccess({collectionId: data.id}));
      }
    });
    this.channel.bind('FavoriteView:create', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.AddFavoriteSuccess({viewId: data.id}));
      }
    });
    this.channel.bind('FavoriteView:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(new ViewsAction.RemoveFavoriteSuccess({viewId: data.id}));
      }
    });
  }

  private bindUserEvents() {
    this.channel.bind('User:update', data => {
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(new UsersAction.UpdateSuccess({user: convertUserDtoToModel(data.object)}));
      }
    });

    this.channel.bind('User:remove', data => {
      if (this.isCurrentOrganization(data)) {
        this.store$.dispatch(new UsersAction.DeleteSuccess({userId: data.id}));
      }
    });
  }

  private bindTemplateEvents() {
    this.channel.bind('TemplateCreated:create', data => {
      timer(2000) // wait for the most recent push notifications to arrive
        .pipe(
          withLatestFrom(
            this.store$.pipe(select(selectCollectionsDictionary)),
            this.store$.pipe(select(selectLinkTypesDictionary)),
            this.store$.pipe(select(selectViewsDictionary))
          ),
          first()
        )
        .subscribe(([, collections, linkTypes, views]) => {
          const allCollections = data.object.collectionIds.every(id => collections[id]);
          const allLinkTypes = data.object.linkTypeIds.every(id => linkTypes[id]);
          const allViews = data.object.viewIds.every(id => views[id]);

          if (!allCollections) {
            this.store$.dispatch(new CollectionsAction.Get({force: true}));
          }
          if (!allLinkTypes) {
            this.store$.dispatch(new LinkTypesAction.Get({force: true}));
          }
          if (!allViews) {
            this.store$.dispatch(new ViewsAction.Get({force: true}));
          }
        });
    });
  }

  private bindSequenceEvents() {
    this.channel.bind('Sequence:update', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new SequencesAction.UpdateSuccess({
            sequence: SequenceConverter.fromDto(data.object),
          })
        );
      }
    });
    this.channel.bind('Sequence:remove', data => {
      if (this.isCurrentWorkspace(data)) {
        this.store$.dispatch(
          new SequencesAction.DeleteSuccess({
            id: data.id,
          })
        );
      }
    });
  }

  private isCurrentWorkspace(data: any): boolean {
    return this.isCurrentOrganization(data) && data.projectId === this.getCurrentProjectId();
  }

  private isCurrentOrganization(data: any): boolean {
    return data.organizationId === this.getCurrentOrganizationId();
  }

  private getCurrentOrganizationId(): string {
    return this.currentOrganization && this.currentOrganization.id;
  }

  private getCurrentProjectId(): string {
    return this.currentProject && this.currentProject.id;
  }

  private subscribeToWorkspace() {
    this.store$
      .pipe(
        select(selectWorkspaceModels),
        filter(models => !!models)
      )
      .subscribe(models => {
        this.currentOrganization = models.organization;
        this.currentProject = models.project;
      });
  }

  public ngOnDestroy(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe();
    }
  }
}
