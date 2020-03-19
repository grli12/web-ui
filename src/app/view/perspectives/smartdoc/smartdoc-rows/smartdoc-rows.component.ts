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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  DEFAULT_SMARTDOC_ID,
  DivisionType,
  SmartDocCell,
  SmartDocRow,
  SmartDocRowsCollection,
} from '../../../../core/store/smartdoc/smartdoc';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Observable} from 'rxjs';

@Component({
  selector: 'smartdoc-rows',
  templateUrl: './smartdoc-rows.component.html',
  styleUrls: ['./smartdoc-rows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartDocRowsComponent {
  @Input()
  public rows: SmartDocRow[];

  public selectedCell: {rowId: string; cellId: string} = {rowId: '', cellId: ''};

  @Output()
  public cellSelected: EventEmitter<{rowId: string; cellId: string}> = new EventEmitter<{
    rowId: string;
    cellId: string;
  }>();

  public drop(event: CdkDragDrop<SmartDocRow[]>) {
    moveItemInArray(this.rows, event.previousIndex, event.currentIndex);
  }

  public onAddRow() {
    this.rows.push({id: DEFAULT_SMARTDOC_ID, rank: 3, type: DivisionType.D13, cells: []});
  }
  onCellSelected(eventArg: {rowId: string; cellId: string}) {
    if (this.selectedCell.cellId == eventArg.cellId) {
      this.selectedCell = {rowId: '', cellId: ''};
    } else {
      this.selectedCell = eventArg;
    }
    this.cellSelected.emit(this.selectedCell);
  }
}
