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

import {Pipe, PipeTransform} from '@angular/core';
import {Attribute} from '../../../core/store/collections/collection';
import {DataValue} from '../../../core/model/data-value';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintType} from '../../../core/model/data/constraint';

@Pipe({
  name: 'dataInputEditInfo',
})
export class DataInputEditInfoPipe implements PipeTransform {
  public transform(
    attribute: Attribute,
    dataValue: DataValue,
    permissions: AllowedPermissions,
    editing: boolean
  ): {readonly: boolean; hasValue: boolean; showDataInput: boolean; selectConstraint: boolean; editing: boolean} {
    const constraint = attribute?.constraint || new UnknownConstraint();
    const asText = constraint.isTextRepresentation;
    const hasValue = dataValue && !!dataValue.format();
    const readonly =
      !permissions || !permissions.writeWithView || !(editing || constraint.type === ConstraintType.Boolean);

    const forceDataInput = constraint.type === ConstraintType.Files;
    return {
      readonly,
      hasValue,
      showDataInput: forceDataInput || !readonly || (!asText && hasValue),
      selectConstraint: constraint.type === ConstraintType.Select,
      editing,
    };
  }
}
