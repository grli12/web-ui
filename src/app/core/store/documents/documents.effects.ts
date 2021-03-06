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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {EMPTY, Observable, of} from 'rxjs';
import {catchError, filter, flatMap, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {UserHintService} from '../../../shared/user-hint/user-hint.service';
import {hasFilesAttributeChanged} from '../../../shared/utils/data/has-files-attribute-changed';
import {ConstraintType} from '../../model/data/constraint';
import {AppState} from '../app.state';
import {hasAttributeType} from '../collections/collection.util';
import {selectCollectionById, selectCollectionsDictionary} from '../collections/collections.state';
import {CommonAction} from '../common/common.action';
import {FileAttachmentsAction} from '../file-attachments/file-attachments.action';
import {convertLinkInstanceDtoToModel, convertLinkInstanceModelToDto} from '../link-instances/link-instance.converter';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {LinkInstance} from '../link-instances/link.instance';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {areQueriesEqual} from '../navigation/query/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {RouterAction} from '../router/router.action';
import {createCallbackActions, emitErrorActions} from '../store.utils';
import {convertDocumentDtoToModel, convertDocumentModelToDto} from './document.converter';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {
  selectDocumentById,
  selectDocumentsDictionary,
  selectDocumentsQueries,
  selectPendingDocumentDataUpdatesByCorrelationId,
} from './documents.state';
import {queryWithoutFilters} from '../navigation/query/query.util';
import {CollectionService, DocumentService, LinkInstanceService, SearchService} from '../../data-service';
import {OrganizationsAction} from '../organizations/organizations.action';
import {objectValues} from '../../../shared/utils/common.utils';

@Injectable()
export class DocumentsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Get>(DocumentsActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectDocumentsQueries))),
    filter(
      ([action, queries]) =>
        action.payload.force ||
        !queries.find(query => areQueriesEqual(query, queryWithoutFilters(action.payload.query)))
    ),
    mergeMap(([action]) => {
      const query = queryWithoutFilters(action.payload.query);
      const queryDto = convertQueryModelToDto(query);

      return this.searchService.searchDocuments(queryDto, action.payload.workspace).pipe(
        map(dtos => dtos.map(dto => convertDocumentDtoToModel(dto))),
        map(documents => new DocumentsAction.GetSuccess({documents, query})),
        catchError(error => of(new DocumentsAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getSingle$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.GetSingle>(DocumentsActionType.GET_SINGLE),
    mergeMap(action =>
      this.documentService.getDocument(action.payload.collectionId, action.payload.documentId).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        map(document => new DocumentsAction.GetSuccess({documents: [document]})),
        catchError(() => EMPTY)
      )
    )
  );

  @Effect()
  public getByIds$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.GetByIds>(DocumentsActionType.GET_BY_IDS),
    mergeMap(action =>
      this.documentService.getDocuments(action.payload.documentsIds).pipe(
        map(dtos => dtos.map(dto => convertDocumentDtoToModel(dto))),
        map(documents => new DocumentsAction.GetSuccess({documents})),
        catchError(() => EMPTY)
      )
    )
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.GetFailure>(DocumentsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'documents.get.fail', value: 'Could not get records'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Create>(DocumentsActionType.CREATE),
    mergeMap(action => {
      const {correlationId} = action.payload.document;
      return this.store$.pipe(
        select(selectPendingDocumentDataUpdatesByCorrelationId(correlationId)),
        take(1),
        filter(pendingDataUpdates => !pendingDataUpdates || Object.keys(pendingDataUpdates).length === 0),
        mergeMap(() => {
          const documentDto = convertDocumentModelToDto(action.payload.document);

          return this.documentService.createDocument(documentDto).pipe(
            map(dto => convertDocumentDtoToModel(dto, correlationId)),
            mergeMap(document => {
              return [
                ...createCallbackActions(action.payload.onSuccess, document.id),
                new DocumentsAction.CreateSuccess({document}),
                new DocumentsAction.PatchDataPending({
                  collectionId: document.collectionId,
                  documentId: document.id,
                  correlationId: document.correlationId,
                }),
                new DocumentsAction.CheckDataHint({document: action.payload.document}),
              ];
            }),
            catchError(error =>
              of(...createCallbackActions(action.payload.onFailure), new DocumentsAction.CreateFailure({error: error}))
            )
          );
        })
      );
    })
  );

  @Effect()
  public createWithLink$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateWithLink>(DocumentsActionType.CREATE_WITH_LINK),
    mergeMap(action => {
      const {document, otherDocumentId, linkInstance: preparedLinkInstance, onSuccess, onFailure} = action.payload;
      const documentDto = convertDocumentModelToDto(document);

      return this.documentService.createDocument(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        mergeMap(newDocument => {
          const linkInstance: LinkInstance = {
            ...preparedLinkInstance,
            documentIds: [newDocument.id, otherDocumentId],
          };
          const linkInstanceDto = convertLinkInstanceModelToDto(linkInstance);
          return this.linkInstanceService.createLinkInstance(linkInstanceDto).pipe(
            map(dto => convertLinkInstanceDtoToModel(dto)),
            mergeMap(newLink => [
              new DocumentsAction.CreateSuccess({document: newDocument}),
              new LinkInstancesAction.CreateSuccess({linkInstance: newLink}),
              ...createCallbackActions(onSuccess, newDocument.id),
            ])
          );
        }),
        catchError(error => of(...createCallbackActions(onFailure), new DocumentsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateSuccess>(DocumentsActionType.CREATE_SUCCESS),
    mergeMap(action => {
      const {collectionId, id: documentId} = action.payload.document;
      return this.store$.pipe(
        select(selectCollectionById(collectionId)),
        take(1),
        mergeMap(collection =>
          hasAttributeType(collection, ConstraintType.Files)
            ? [new FileAttachmentsAction.Get({collectionId, documentId})]
            : []
        )
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateFailure>(DocumentsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.pipe(select(selectOrganizationByWorkspace))),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
        const message = this.i18n({
          id: 'document.create.serviceLimits',
          value:
            'You are currently on the Free plan which allows you to have only limited number of records. Do you want to upgrade to Business now?',
        });
        return new OrganizationsAction.OfferPayment({message, organizationCode: organization.code});
      }
      const errorMessage = this.i18n({id: 'document.create.fail', value: 'Could not create the record'});
      return new NotificationsAction.Error({message: errorMessage});
    })
  );

  @Effect()
  public createChain$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateChain>(DocumentsActionType.CREATE_CHAIN),
    mergeMap(action => {
      const {documents, linkInstances, failureMessage} = action.payload;
      const documentsDtos = documents.map(document => convertDocumentModelToDto(document));
      const linkInstancesDtos = linkInstances.map(link => convertLinkInstanceModelToDto(link));

      return this.documentService.createChain(documentsDtos, linkInstancesDtos).pipe(
        mergeMap(({documents: documentDtos, linkInstances: linkDtos}) => {
          const newDocuments = documentDtos.map(dto => convertDocumentDtoToModel(dto));
          const newLinks = linkDtos.map(dto => convertLinkInstanceDtoToModel(dto));
          return [
            new DocumentsAction.CreateChainSuccess({documents: newDocuments}),
            new LinkInstancesAction.CreateMultipleSuccess({linkInstances: newLinks}),
          ];
        }),
        catchError(() => of(new NotificationsAction.Error({message: failureMessage})))
      );
    })
  );

  @Effect()
  public patch$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Patch>(DocumentsActionType.PATCH),
    mergeMap(action => {
      const {collectionId, documentId} = action.payload;
      return this.store$.pipe(
        select(selectDocumentById(documentId)),
        take(1),
        mergeMap(originalDocument => {
          const documentDto = convertDocumentModelToDto(action.payload.document);
          return this.documentService.patchDocument(collectionId, documentId, documentDto).pipe(
            map(dto => convertDocumentDtoToModel(dto)),
            map(document => new DocumentsAction.UpdateSuccess({document, originalDocument})),
            catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
          );
        })
      );
    })
  );

  @Effect()
  public duplicate$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Duplicate>(DocumentsActionType.DUPLICATE),
    mergeMap(action => {
      const {collectionId, documentIds, correlationId, onSuccess, onFailure} = action.payload;
      return this.documentService.duplicateDocuments(collectionId, documentIds, correlationId).pipe(
        map(dtos => dtos.map(dto => convertDocumentDtoToModel(dto, correlationId))),
        mergeMap(documents => [
          new DocumentsAction.DuplicateSuccess({documents}),
          ...createCallbackActions(onSuccess, documents),
        ]),
        catchError(error => emitErrorActions(error, onFailure))
      );
    })
  );

  @Effect()
  public duplicateSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DuplicateSuccess>(DocumentsActionType.DUPLICATE_SUCCESS),
    mergeMap(action => {
      const {documents} = action.payload;
      const {collectionId} = documents[0];
      return this.store$.pipe(
        select(selectCollectionById(collectionId)),
        take(1),
        mergeMap(collection =>
          hasAttributeType(collection, ConstraintType.Files)
            ? documents.map(doc => new FileAttachmentsAction.Get({collectionId, documentId: doc.id}))
            : []
        )
      );
    })
  );

  @Effect()
  public addFavorite$ = this.actions$.pipe(
    ofType<DocumentsAction.AddFavorite>(DocumentsActionType.ADD_FAVORITE),
    mergeMap(action =>
      this.documentService
        .addFavorite(action.payload.collectionId, action.payload.documentId, action.payload.workspace)
        .pipe(
          mergeMap(() => of()),
          catchError(error =>
            of(
              new DocumentsAction.AddFavoriteFailure({
                documentId: action.payload.documentId,
                error: error,
              })
            )
          )
        )
    )
  );

  @Effect()
  public addFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.AddFavoriteFailure>(DocumentsActionType.ADD_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.add.favorite.fail', value: 'Could not add the record to favorites'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removeFavorite$ = this.actions$.pipe(
    ofType<DocumentsAction.RemoveFavorite>(DocumentsActionType.REMOVE_FAVORITE),
    mergeMap(action =>
      this.documentService
        .removeFavorite(action.payload.collectionId, action.payload.documentId, action.payload.workspace)
        .pipe(
          mergeMap(() => of()),
          catchError(error =>
            of(
              new DocumentsAction.RemoveFavoriteFailure({
                documentId: action.payload.documentId,
                error: error,
              })
            )
          )
        )
    )
  );

  @Effect()
  public removeFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.RemoveFavoriteFailure>(DocumentsActionType.REMOVE_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'document.remove.favorite.fail',
        value: 'Could not remove the record from favorites',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateFailure>(DocumentsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.update.fail', value: 'Could not update the record'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public updateSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateSuccess>(DocumentsActionType.UPDATE_SUCCESS),
    mergeMap(action => {
      const {document, originalDocument} = action.payload;
      const {collectionId, id: documentId} = document;
      return this.store$.pipe(
        select(selectCollectionById(collectionId)),
        take(1),
        mergeMap(collection =>
          hasFilesAttributeChanged(collection, document, originalDocument)
            ? [new FileAttachmentsAction.Get({collectionId, documentId})]
            : []
        )
      );
    })
  );

  @Effect()
  public updateData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateData>(DocumentsActionType.UPDATE_DATA),
    withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
    mergeMap(([action, documents]) => {
      const originalDocument = documents[action.payload.document.id];
      return of(new DocumentsAction.UpdateDataInternal({...action.payload, originalDocument}));
    })
  );

  @Effect()
  public updateDataInternal$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateDataInternal>(DocumentsActionType.UPDATE_DATA_INTERNAL),
    mergeMap(action => {
      const originalDocument = action.payload.originalDocument;
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService.updateDocumentData(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        map(document => new DocumentsAction.UpdateSuccess({document, originalDocument})),
        catchError(error => of(new DocumentsAction.UpdateFailure({error: error, originalDocument})))
      );
    })
  );

  @Effect()
  public patchData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchData>(DocumentsActionType.PATCH_DATA),
    withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
    mergeMap(([action, documents]) => {
      const originalDocument = documents[action.payload.document.id];
      return of(new DocumentsAction.PatchDataInternal({...action.payload, originalDocument}));
    })
  );

  @Effect()
  public checkDataHint$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CheckDataHint>(DocumentsActionType.CHECK_DATA_HINT),
    withLatestFrom(
      this.store$.pipe(select(selectDocumentsDictionary)),
      this.store$.pipe(select(selectCollectionsDictionary))
    ),
    mergeMap(([action, documents, collections]) => {
      const document = action.payload.document;
      const documentsInCollection = objectValues(documents).filter(d => d.collectionId === document.collectionId);
      const currentCollection = collections[document.collectionId];
      const entries = Object.entries(document.data);

      if (entries.length > 0) {
        const entry = entries[0];
        const values = documentsInCollection.map(d => d.data[entry[0]]);

        return this.userHints.processDataHints(values, entry, currentCollection);
      }

      return EMPTY;
    })
  );

  @Effect()
  public patchDataInternal$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchDataInternal>(DocumentsActionType.PATCH_DATA_INTERNAL),
    mergeMap(action => {
      const originalDocument = action.payload.originalDocument;
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService.patchDocumentData(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        flatMap(document => [
          new DocumentsAction.UpdateSuccess({document, originalDocument}),
          new DocumentsAction.CheckDataHint({document: action.payload.document}),
        ]),
        catchError(error => of(new DocumentsAction.UpdateFailure({error: error, originalDocument})))
      );
    })
  );

  @Effect()
  public patchDataPending$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchDataPending>(DocumentsActionType.PATCH_DATA_PENDING),
    mergeMap(action => {
      const {collectionId, correlationId, documentId: id} = action.payload;
      return this.store$.pipe(
        select(selectPendingDocumentDataUpdatesByCorrelationId(correlationId)),
        take(1),
        filter(data => data && Object.keys(data).length > 0),
        map(data => new DocumentsAction.PatchData({document: {collectionId, correlationId, id, data}}))
      );
    })
  );

  @Effect()
  public patchMetaData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchMetaData>(DocumentsActionType.PATCH_META_DATA),
    mergeMap(action => {
      const {collectionId, documentId, metaData} = action.payload;
      return this.store$.pipe(
        select(selectDocumentById(documentId)),
        take(1),
        mergeMap(originalDocument => {
          return this.documentService.patchDocumentMetaData(collectionId, documentId, metaData).pipe(
            mergeMap(dto => {
              const document = {...convertDocumentDtoToModel(dto), data: originalDocument.data};
              const actions: Action[] = [new DocumentsAction.UpdateSuccess({document, originalDocument})];

              if (action.payload.onSuccess) {
                actions.push(new CommonAction.ExecuteCallback({callback: () => action.payload.onSuccess(document)}));
              }

              return actions;
            }),
            catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
          );
        })
      );
    })
  );

  @Effect()
  public updateMetaData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateMetaData>(DocumentsActionType.UPDATE_META_DATA),
    mergeMap(action => {
      const {document} = action.payload;
      return this.store$.pipe(
        select(selectDocumentById(document.id)),
        take(1),
        mergeMap(originalDocument => {
          const documentDto = convertDocumentModelToDto(document);
          return this.documentService.updateDocumentMetaData(documentDto).pipe(
            map(
              dto =>
                new DocumentsAction.UpdateSuccess({
                  document: convertDocumentDtoToModel(dto),
                  originalDocument,
                })
            ),
            catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
          );
        })
      );
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Delete>(DocumentsActionType.DELETE),
    mergeMap(action => {
      return this.documentService.removeDocument(action.payload.collectionId, action.payload.documentId).pipe(
        map(() => action.payload),
        flatMap(payload => {
          const actions: Action[] = [new DocumentsAction.DeleteSuccess({documentId: action.payload.documentId})];

          if (payload.nextAction) {
            actions.push(payload.nextAction);
          }

          return actions;
        }),
        catchError(error => of(new DocumentsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteConfirm$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteConfirm>(DocumentsActionType.DELETE_CONFIRM),
    map((action: DocumentsAction.DeleteConfirm) => {
      const title = this.i18n({id: 'document.delete.dialog.title', value: 'Delete record'});
      const message = this.i18n({
        id: 'document.delete.dialog.message',
        value: 'Do you really want to delete this record?',
      });

      return new NotificationsAction.Confirm({
        title,
        message,
        action: new DocumentsAction.Delete(action.payload),
        type: 'danger',
      });
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteFailure>(DocumentsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.delete.fail', value: 'Could not delete the record'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private documentService: DocumentService,
    private linkInstanceService: LinkInstanceService,
    private collectionService: CollectionService,
    private i18n: I18n,
    private searchService: SearchService,
    private store$: Store<AppState>,
    private userHints: UserHintService
  ) {}
}
