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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {ContextMenuComponent} from 'ngx-contextmenu';
import {combineLatest, Observable, of} from 'rxjs';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {
  selectTableFirstCollectionId,
  selectTableRowIndentable,
  selectTableRowOutdentable,
} from '../../../../../../../../core/store/tables/tables.selector';
import {isMacOS} from '../../../../../../../../shared/utils/system.utils';
import {AllowedPermissions} from '../../../../../../../../core/model/allowed-permissions';
import {CollectionPermissionsPipe} from '../../../../../../../../shared/pipes/permissions/collection-permissions.pipe';
import {selectCollectionsDictionary} from '../../../../../../../../core/store/collections/collections.state';
import {map, mergeMap} from 'rxjs/operators';

@Component({
  selector: 'table-hierarchy-cell-menu',
  templateUrl: './table-hierarchy-cell-menu.component.html',
  styleUrls: ['./table-hierarchy-cell-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHierarchyCellMenuComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public canManageConfig: boolean;

  @ViewChild(ContextMenuComponent, {static: true})
  public contextMenu: ContextMenuComponent;

  public readonly macOS = isMacOS();

  public indentable$: Observable<boolean>;
  public outdentable$: Observable<boolean>;
  public allowedPermissions$: Observable<AllowedPermissions>;

  constructor(private store$: Store<{}>, private collectionPermissionPipe: CollectionPermissionsPipe) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.indentable$ = this.store$.select(selectTableRowIndentable(this.cursor));
      this.outdentable$ = this.store$.select(selectTableRowOutdentable(this.cursor));
      this.allowedPermissions$ = this.selectAllowedPermissions$();
    }
  }

  private selectAllowedPermissions$(): Observable<AllowedPermissions> {
    return combineLatest([
      this.store$.pipe(select(selectTableFirstCollectionId(this.cursor.tableId))),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([collectionId, collectionsMap]) => collectionsMap[collectionId]),
      mergeMap(collection => this.collectionPermissionPipe.transform(collection))
    );
  }

  public onIndent() {
    this.store$.dispatch(new TablesAction.IndentRow({cursor: this.cursor}));
  }

  public onOutdent() {
    this.store$.dispatch(new TablesAction.OutdentRow({cursor: this.cursor}));
  }
}
