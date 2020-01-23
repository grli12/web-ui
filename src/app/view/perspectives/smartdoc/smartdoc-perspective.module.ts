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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SmartdocPerspectiveComponent} from './smartdoc-perspective.component';
import {SmartdocPerspectiveRoutingModule} from './smartdoc-perspective-routing.module';
import {CollapsibleSidebarModule} from '../../../shared/collapsible-sidebar/collapsible-sidebar.module';
import {SharedModule} from '../../../shared/shared.module';
import {SmartdocConfigComponent} from './config/smartdoc-config.component';
import {SmartDocRowsComponent} from './smartdoc-rows/smartdoc-rows.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {SmartdocRowComponent} from './smartdoc-rows/smartdoc-row/smartdoc-row.component';
import {SmartdocCellComponent} from './smartdoc-cells/smartdoc-cell/smartdoc-cell.component';
import {SmartDocCellsComponent} from './smartdoc-cells/smartdoc-cells.component';

@NgModule({
  declarations: [
    SmartdocPerspectiveComponent,
    SmartdocConfigComponent,
    SmartDocRowsComponent,
    SmartdocRowComponent,
    SmartdocCellComponent,
    SmartDocCellsComponent,
  ],
  imports: [SmartdocPerspectiveRoutingModule, CollapsibleSidebarModule, SharedModule, DragDropModule],
})
export class SmartDocPerspectiveModule {}
