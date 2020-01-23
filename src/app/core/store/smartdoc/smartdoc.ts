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
export const DEFAULLT_SMARTDOC_ID = 'default';

export interface SmartDoc {
  id: string;
  config?: SmartDocConfig;
}

export interface SmartDocConfig {
  version?: SmartDocVersion;
}

export enum SmartDocVersion {
  V1 = '1',
}

export enum DivisionType {
  D1111 = '1fr 1fr 1fr 1fr',
  D112 = '1fr 1fr 2fr',
  D121 = '1fr 2fr 1fr',
  D211 = '2fr 1fr 1fr',
  D13 = '1fr 3fr',
  D31 = '3fr 1fr',
  D22 = '2fr 2fr',
  D4 = 'auto',
}

export interface SmartDocRow {
  id: string;
  type: DivisionType;
  rank: number;
  cells: SmartDocCell[];
}

export interface SmartDocRowsCollection {
  id: string;
  rows: SmartDocRow[];
}

export interface SmartDocCell {
  id: string;
  color: string;
  tableName: string;
  isUsed: boolean;
  caption: string;
}
