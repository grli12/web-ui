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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {SmartDocCell} from '../../../../core/store/smartdoc/smartdoc';

@Component({
  selector: 'smartdoc-cells',
  templateUrl: './smartdoc-cells.component.html',
  styleUrls: ['./smartdoc-cells.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartDocCellsComponent {
  private cells: SmartDocCell[] = [
    {id: '1', tableName: 'users', caption: 'Name', color: 'red', isUsed: false},
    {id: '2', tableName: 'users', caption: 'Gender', color: 'red', isUsed: false},
    {id: '3', tableName: 'users', caption: 'Age', color: 'red', isUsed: false},
    {id: '4', tableName: 'customers', caption: 'Name', color: 'blue', isUsed: false},
  ];
}
