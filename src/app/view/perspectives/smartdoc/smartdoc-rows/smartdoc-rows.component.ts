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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {DivisionType, SmartDocRow, SmartDocRowsCollection} from '../../../../core/store/smartdoc/smartdoc';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'smartdoc-rows',
  templateUrl: './smartdoc-rows.component.html',
  styleUrls: ['./smartdoc-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartDocRowsComponent {
  public rowsCollection: SmartDocRowsCollection = {
    id: '1',
    rows: [
      {
        id: '1',
        rank: 0,
        type: DivisionType.D1111,
        cells: [
          {id: '1c', color: 'red', tableName: 'customers', caption: 'surname', isUsed: true},
          {id: '1c', color: 'red', tableName: 'customers', caption: 'age', isUsed: true},
          {id: '1c', color: 'red', tableName: 'customers', caption: 'gender', isUsed: true},
          {id: '1c', color: 'red', tableName: 'customers', caption: 'company', isUsed: true},
        ],
      },
      {
        id: '2',
        rank: 1,
        type: DivisionType.D211,
        cells: [
          {id: '1c', color: 'red', tableName: 'customers', caption: 'email', isUsed: true},
          {id: '1c', color: 'red', tableName: 'customers', caption: 'category', isUsed: true},
          {id: '1c', color: 'red', tableName: 'customers', caption: 'phone number', isUsed: true},
        ],
      },
      {
        id: '3',
        rank: 2,
        type: DivisionType.D121,
        cells: [
          {id: '1c', color: 'blue', tableName: 'products', caption: 'name', isUsed: true},
          {id: '1c', color: 'blue', tableName: 'products', caption: 'cost', isUsed: true},
          {id: '1c', color: 'blue', tableName: 'products', caption: 'amount', isUsed: true},
        ],
      },
      {
        id: '4',
        rank: 3,
        type: DivisionType.D112,
        cells: [
          {id: '1c', color: 'blue', tableName: 'products', caption: 'country', isUsed: true},
          {id: '1c', color: 'blue', tableName: 'products', caption: 'expiration', isUsed: true},
          {id: '1c', color: 'blue', tableName: 'products', caption: 'description', isUsed: true},
        ],
      },
      {
        id: '5',
        rank: 4,
        type: DivisionType.D13,
        cells: [
          {id: '1c', color: 'orange', tableName: 'companies', caption: 'name', isUsed: true},
          {id: '1c', color: 'orange', tableName: 'companies', caption: 'address', isUsed: true},
        ],
      },
      {
        id: '6',
        rank: 5,
        type: DivisionType.D31,
        cells: [
          {id: '1c', color: 'green', tableName: 'managers', caption: 'surname', isUsed: true},
          {id: '1c', color: 'green', tableName: 'managers', caption: 'grade', isUsed: true},
        ],
      },
      {
        id: '7',
        rank: 6,
        type: DivisionType.D4,
        cells: [{id: '1c', color: 'lightyellow', tableName: 'custom', caption: 'header', isUsed: true}],
      },
      {
        id: '7',
        rank: 6,
        type: DivisionType.D22,
        cells: [
          {id: '1c', color: 'lightyellow', tableName: 'custom', caption: 'subheader1', isUsed: true},
          {id: '1c', color: 'lightyellow', tableName: 'custom', caption: 'subheader2', isUsed: true},
        ],
      },
    ],
  };

  public drop(event: CdkDragDrop<SmartDocRow[]>) {
    moveItemInArray(this.rowsCollection.rows, event.previousIndex, event.currentIndex);
  }

  public onAddRow() {
    this.rowsCollection.rows.push({id: '1', rank: 3, type: DivisionType.D13, cells: []});
  }
}
