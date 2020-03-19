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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import {CollapsibleSidebarComponent} from '../../../shared/collapsible-sidebar/collapsible-sidebar.component';
import {DivisionType, SmartDocCell, SmartDocRow, SmartDocRowsCollection} from '../../../core/store/smartdoc/smartdoc';
import {BehaviorSubject, Subject} from 'rxjs';

@Component({
  selector: 'smartdoc-perspective',
  templateUrl: './smartdoc-perspective.component.html',
  styleUrls: ['./smartdoc-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartdocPerspectiveComponent implements OnInit {
  public rowsCollection: SmartDocRowsCollection = {
    id: '1',
    rows: [
      {
        id: '1',
        rank: 0,
        type: DivisionType.D1111,
        cells: [
          {id: '1', color: 'red', tableName: 'customers', caption: 'surname', isUsed: true},
          {id: '2', color: 'red', tableName: 'customers', caption: 'age', isUsed: true},
          {id: '3', color: 'red', tableName: 'customers', caption: 'gender', isUsed: true},
          {id: '4', color: 'red', tableName: 'customers', caption: 'company', isUsed: true},
        ],
      },
      {
        id: '2',
        rank: 1,
        type: DivisionType.D211,
        cells: [
          {id: '5', color: 'red', tableName: 'customers', caption: 'email', isUsed: true},
          {id: '6', color: 'red', tableName: 'customers', caption: 'category', isUsed: true},
          {id: '7', color: 'red', tableName: 'customers', caption: 'phone number', isUsed: true},
        ],
      },
      {
        id: '3',
        rank: 2,
        type: DivisionType.D121,
        cells: [
          {id: '8', color: 'blue', tableName: 'products', caption: 'name', isUsed: true},
          {id: '9', color: 'blue', tableName: 'products', caption: 'cost', isUsed: true},
          {id: '10', color: 'blue', tableName: 'products', caption: 'amount', isUsed: true},
        ],
      },
      {
        id: '4',
        rank: 3,
        type: DivisionType.D112,
        cells: [
          {id: '11', color: 'blue', tableName: 'products', caption: 'country', isUsed: true},
          {id: '12', color: 'blue', tableName: 'products', caption: 'description', isUsed: true},
          {id: '13', color: '', tableName: '', caption: '', isUsed: false},
        ],
      },
      {
        id: '5',
        rank: 4,
        type: DivisionType.D13,
        cells: [
          {id: '14', color: 'orange', tableName: 'companies', caption: 'name', isUsed: true},
          {id: '15', color: 'orange', tableName: 'companies', caption: 'address', isUsed: true},
        ],
      },
      {
        id: '6',
        rank: 5,
        type: DivisionType.D31,
        cells: [
          {id: '16', color: 'green', tableName: 'managers', caption: 'surname', isUsed: true},
          {id: '17', color: 'green', tableName: 'managers', caption: 'grade', isUsed: true},
        ],
      },
      {
        id: '7',
        rank: 6,
        type: DivisionType.D4,
        cells: [{id: '18', color: 'lightyellow', tableName: 'custom', caption: 'header', isUsed: true}],
      },
      {
        id: '7',
        rank: 6,
        type: DivisionType.D22,
        cells: [
          {id: '19', color: 'lightyellow', tableName: 'custom', caption: 'subheader1', isUsed: true},
          {id: '20', color: 'lightyellow', tableName: 'custom', caption: 'subheader2', isUsed: true},
        ],
      },
    ],
  };
  @ViewChild(CollapsibleSidebarComponent, {read: ElementRef, static: false})
  public sidebarComponent: ElementRef;

  public sidebarCollapsed: boolean = true;

  public selectedCell: {rowId: string; cellId: string} = {rowId: '', cellId: ''};

  @Output()
  public cellAdded: EventEmitter<any> = new EventEmitter<any>();

  private subject: Subject<SmartDocCell> = new Subject<SmartDocCell>();

  ngOnInit(): void {
    this.subject.subscribe(value => this.addCell(value));
  }
  onCellSelected(eventArg: {rowId: string; cellId: string}) {
    this.selectedCell = eventArg;
    this.sidebarCollapsed = this.selectedCell.cellId == '';
  }

  private addCell(cell: SmartDocCell) {
    if (this.selectedCell.cellId != '') {
      let rowIndex: number = this.rowsCollection.rows.findIndex(r => r.id == this.selectedCell.rowId);
      let cellIndex: number = this.rowsCollection.rows[rowIndex].cells.findIndex(c => c.id == this.selectedCell.cellId);
      let newRows = [...this.rowsCollection.rows];
      let row = {...this.rowsCollection.rows[rowIndex]};
      row.cells = [...this.rowsCollection.rows[rowIndex].cells];
      row.cells[cellIndex] = cell;
      newRows[rowIndex] = row;
      this.rowsCollection.rows = newRows;

      this.cellAdded.emit();

      console.log('CELL ADDED');
    }
  }
  onSidebarCellSelected(eventArg: SmartDocCell) {
    this.subject.next(eventArg);
  }
}
