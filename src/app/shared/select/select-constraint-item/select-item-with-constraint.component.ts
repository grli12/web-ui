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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {AttributesResource} from '../../../core/model/resource';
import {Constraint, ConstraintConfig} from '../../../core/model/data/constraint';
import {I18n} from '@ngx-translate/i18n-polyfill';

export interface SelectItemWithConstraintItemId {
  resourceIndex: number;
  attributeId: string;
}

@Component({
  selector: 'select-item-with-constraint',
  templateUrl: './select-item-with-constraint.component.html',
  styleUrls: ['./select-item-with-constraint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemWithConstraint {
  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public restrictedIds: SelectItemWithConstraintItemId[];

  @Input()
  public selectedId: SelectItemWithConstraintItemId;

  @Input()
  public selectedConstraint: Constraint;

  @Input()
  public placeholderIcon: string;

  @Input()
  public placeholderText: string = '';

  @Input()
  public emptyValue: string = '';

  @Input()
  public disabled: boolean;

  @Input()
  public removable: boolean = false;

  @Input()
  public buttonClasses: string;

  @Output()
  public select = new EventEmitter<SelectItemWithConstraintItemId>();

  @Output()
  public selectConfig = new EventEmitter<Partial<ConstraintConfig>>();

  @Output()
  public remove = new EventEmitter();

  public readonly configPlaceholder: string;

  constructor(private i18n: I18n) {
    this.configPlaceholder = i18n({id: 'select.constraint.item.config', value: 'Config'});
  }

  public onSelect(id: SelectItemWithConstraintItemId) {
    this.select.emit(id);
  }

  public onRemove() {
    this.remove.emit();
  }

  public onSelectConfig(config: Partial<ConstraintConfig>) {
    this.selectConfig.emit(config);
  }
}
