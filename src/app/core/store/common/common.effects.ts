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

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {CommonAction, CommonActionType} from './common.action';

@Injectable()
export class CommonEffects {
  @Effect({dispatch: false})
  public executeCallback$: Observable<Action> = this.actions$.pipe(
    ofType<CommonAction.ExecuteCallback>(CommonActionType.EXECUTE_CALLBACK),
    tap((action: CommonAction.ExecuteCallback) => action.payload.callback())
  );

  @Effect({dispatch: false})
  public handleError$: Observable<Action> = this.actions$.pipe(
    ofType<CommonAction.HandleError>(CommonActionType.HANDLE_ERROR),
    tap((action: CommonAction.HandleError) => console.error(action.payload.error)) // TODO maybe send to Sentry as well
  );

  constructor(private actions$: Actions) {}
}
