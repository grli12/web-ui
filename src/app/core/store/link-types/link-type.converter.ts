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

import {LinkTypeDto} from '../../dto';
import {convertAttributeDtoToModel, convertAttributeModelToDto} from '../collections/attribute.converter';
import {LinkType} from './link.type';
import {convertRulesFromDto, convertRulesToDto} from '../store.utils';

export function convertLinkTypeDtoToModel(
  dto: LinkTypeDto,
  correlationId?: string,
  preventSortAttributes?: boolean
): LinkType {
  const attributes = dto.attributes ? dto.attributes.map(attribute => convertAttributeDtoToModel(attribute)) : [];
  return {
    id: dto.id,
    name: dto.name,
    collectionIds: dto.collectionIds,
    attributes: !preventSortAttributes
      ? attributes.sort((a, b) => +a.id.substring(1) - +b.id.substring(1))
      : attributes,
    correlationId: correlationId,
    version: dto.version,
    linksCount: dto.linksCount,
    rules: convertRulesFromDto(dto.rules),
  };
}

export function convertLinkTypeModelToDto(model: LinkType): LinkTypeDto {
  return {
    id: model.id,
    correlationId: model.correlationId,
    name: model.name,
    collectionIds: model.collectionIds,
    attributes: model.attributes ? model.attributes.map(convertAttributeModelToDto) : [],
    rules: convertRulesToDto(model.rules),
  };
}
