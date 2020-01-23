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

import {Action} from '@ngrx/store';
import {SmartDoc, SmartDocConfig} from './smartdoc';

export enum SmartDocActionType {
  ADD_SMARTDOC = '[SmartDoc] Add smartdoc',
  REMOVE_SMARTDOC = '[SmartDoc] Remove smartdoc',

  SET_CONFIG = '[SmartDoc] Set config',

  CLEAR = '[SmartDoc] Clear',
}

export namespace SmartDocAction {
  export class AddSmartDoc implements Action {
    public readonly type = SmartDocActionType.ADD_SMARTDOC;

    public constructor(public payload: {smartDoc: SmartDoc}) {}
  }

  export class RemoveSmartDoc implements Action {
    public readonly type = SmartDocActionType.REMOVE_SMARTDOC;

    public constructor(public payload: {smartDocId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = SmartDocActionType.SET_CONFIG;

    public constructor(public payload: {smartDocId: string; config: SmartDocConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = SmartDocActionType.CLEAR;
  }

  export type All = AddSmartDoc | RemoveSmartDoc | SetConfig | Clear;
}
