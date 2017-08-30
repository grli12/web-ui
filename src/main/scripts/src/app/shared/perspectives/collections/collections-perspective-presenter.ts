/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {ComponentFactoryResolver} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {PerspectivePresenter} from '../perspective-presenter';
import {CollectionsPerspective} from './collections-perspective';

export abstract class CollectionsPerspectivePresenter extends PerspectivePresenter {

  protected constructor(activatedRoute: ActivatedRoute,
                        componentFactoryResolver: ComponentFactoryResolver) {
    super(activatedRoute, componentFactoryResolver);
  }

  public loadPerspective() {
    this.loadPerspectiveComponent(CollectionsPerspective.getPerspective(this.perspective).component);
  }

}