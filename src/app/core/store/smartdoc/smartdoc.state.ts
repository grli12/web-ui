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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {DEFAULT_SMARTDOC_ID, SmartDoc} from './smartdoc';
import {AppState} from '../app.state';
import {createSelector, createSelectorFactory} from '@ngrx/store';

export interface SmartDocState extends EntityState<SmartDoc> {}

export const smartDocAdapter = createEntityAdapter<SmartDoc>({selectId: smartDoc => smartDoc.id});

export const initialSmartDocState: SmartDocState = smartDocAdapter.getInitialState();

export const selectSmartDocState = (state: AppState) => state.smartDoc;

export const selectSmartDocDictionary = createSelector(
  selectSmartDocState,
  smartDocAdapter.getSelectors().selectEntities
);

export const selectSmartDocById = id =>
  createSelector(
    selectSmartDocDictionary,
    smartDoc => smartDoc[id]
  );

export const selectDefaultSmartDoc = selectSmartDocById(DEFAULT_SMARTDOC_ID);

export const selectSmartDocConfig = createSelector(
  selectDefaultSmartDoc,
  smartDoc => smartDoc && smartDoc.config
);
