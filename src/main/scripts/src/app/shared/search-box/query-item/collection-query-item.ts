/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {Collection} from '../../../core/dto/collection';

export class CollectionQueryItem implements QueryItem {

  public type = QueryItemType.Collection;

  public code: string;
  public name: string;
  public icon: string;
  public color: string;

  public constructor(collection: Collection) {
    this.code = collection.code;
    this.name = collection.name;
    this.icon = collection.icon;
    this.color = collection.color;
  }

  public get text(): string {
    return this.name;
  }

  public get value(): string {
    return this.code;
  }

  public isComplete(): boolean {
    return true; // TODO detect changes
  }

}
