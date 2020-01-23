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

import {initialSmartDocState, smartDocAdapter, SmartDocState} from './smartdoc.state';
import {SmartDocAction, SmartDocActionType} from './smartdoc.action';

export function smartDocReducer(
  state: SmartDocState = initialSmartDocState,
  action: SmartDocAction.All
): SmartDocState {
  switch (action.type) {
    case SmartDocActionType.ADD_SMARTDOC:
      return smartDocAdapter.addOne(action.payload.smartDoc, state);
    case SmartDocActionType.REMOVE_SMARTDOC:
      return smartDocAdapter.removeOne(action.payload.smartDocId, state);
    case SmartDocActionType.SET_CONFIG:
      return smartDocAdapter.updateOne(
        {id: action.payload.smartDocId, changes: {config: action.payload.config}},
        state
      );
    case SmartDocActionType.CLEAR:
      return initialSmartDocState;
    default:
      return state;
  }
}
