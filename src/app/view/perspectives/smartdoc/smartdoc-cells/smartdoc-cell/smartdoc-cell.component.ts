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

import {Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {SmartDocCell} from '../../../../../core/store/smartdoc/smartdoc';

@Component({
  selector: 'smartdoc-cell',
  templateUrl: './smartdoc-cell.component.html',
  styleUrls: ['./smartdoc-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartdocCellComponent {
  @Input()
  public color: string;

  @Input()
  public caption: string;

  @Input()
  public isUsed = false;

  @Input()
  public id: string;

  @Input()
  public tableName: string;

  @Input()
  public selectedCellId: string = '';

  @Output()
  public cellSelected: EventEmitter<{cellId: string}> = new EventEmitter<{cellId: string}>();

  public onClick() {
    //this.isSelected = !this.isSelected;
    console.log('Cell click. cellId: ' + this.id);
    this.cellSelected.emit({cellId: this.id});
  }
}
