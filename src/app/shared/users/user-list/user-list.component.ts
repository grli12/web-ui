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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {User} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Permission} from '../../../core/store/permissions/permissions';
import {Resource} from '../../../core/model/resource';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';
import {Store, select} from '@ngrx/store';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {debounceTime, take, filter} from 'rxjs/operators';
import {Subject, Subscription} from 'rxjs';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit, OnDestroy {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public users: User[];

  @Input()
  public currentUser: User;

  @Input()
  public resource: Resource;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Output()
  public userCreated = new EventEmitter<string>();

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public usersPermissionsChangeToStore = new EventEmitter<{permissions: Permission[]}>();

  @Output()
  public usersPermissionsChange = new EventEmitter<{
    permissions: Permission[];
    currentPermissions: Permission[];
    workspace?: Workspace;
  }>();

  public searchString: string;

  private initialWorkspace: Workspace;
  private pendingUserUpdates: Record<string, {new: Permission; current: Permission}> = {};
  private rolesChange$ = new Subject<string>();
  private rolesChangeSubscription: Subscription;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.selectInitialWorkspace();
    this.subscribeToRolesChange();
  }

  private selectInitialWorkspace() {
    this.store$
      .pipe(select(selectWorkspaceWithIds))
      .pipe(
        filter(workspace => !!workspace.organizationId),
        take(1)
      )
      .subscribe(workspace => (this.initialWorkspace = workspace));
  }

  private subscribeToRolesChange() {
    this.rolesChangeSubscription = this.rolesChange$
      .pipe(debounceTime(2000))
      .subscribe(() => this.sendAndClearPendingUpdates());
  }

  private sendAndClearPendingUpdates() {
    if (Object.keys(this.pendingUserUpdates).length > 0) {
      const permissions: Permission[] = [];
      const currentPermissions: Permission[] = [];
      Object.values(this.pendingUserUpdates).forEach(value => {
        permissions.push(value.new);
        currentPermissions.push(value.current);
      });

      const data = {permissions, currentPermissions, workspace: this.initialWorkspace};
      this.usersPermissionsChange.emit(data);
    }
    this.pendingUserUpdates = {};
  }

  public ngOnDestroy() {
    if (this.rolesChangeSubscription) {
      this.rolesChangeSubscription.unsubscribe();
    }
    this.sendAndClearPendingUpdates();
  }

  public onUserRolesChanged(userId: string, roles: string[]) {
    const current = this.getUserPermission(userId);
    const newPermission = {id: userId, roles};
    this.pendingUserUpdates[userId] = {new: newPermission, current};
    this.rolesChange$.next('');
    this.usersPermissionsChangeToStore.emit({permissions: [newPermission]});
  }

  private getUserPermission(userId: string): Permission {
    return (
      this.resource &&
      this.resource.permissions &&
      this.resource.permissions.users &&
      this.resource.permissions.users.find(perm => perm.id === userId)
    );
  }

  public trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
