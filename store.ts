import {Subscription, Subject, PartialObserver, Observable} from 'rxjs';
import {scan, share} from 'rxjs/operators';

import {getLogger} from 'loglevel';

const logger = getLogger('Store');

// An action is dispatched by the store's dispatch function and represents interaction and new
// information from the user. Reducers are passed actions to update state.
export interface Action {
  type: string;
  error?: Error;
}

// An action that also has a payload, representing new information.
export interface PayloadAction<P> extends Action {
  payload: P;
}

// An action that also has some additional information.
export interface MetaAction<M> extends Action {
  meta: M;
}

// A combination of PayloadAction and MetaAction.
export type PayloadMetaAction<P, M> = PayloadAction<P> & MetaAction<M>;

// A function that is dispatched by the store's dispatchAsync method, and provides the store's methods to allow for
// asynchronous code to execute, to get the current state, or to dispatch actions once asynchronous code returns.
export type AsyncAction<T> = (store: Store<T>) => PromiseLike<any>;

// A type guard to check if an object is a PayloadAction type.
export function isPayloadAction<P>(type: any): type is PayloadAction<P> {
  return (<PayloadAction<P>> type).payload !== undefined;
}

// A type guard to check if an object is a MetaAction type.
export function isMetaAction<M>(type: any): type is MetaAction<M> {
  return (<MetaAction<M>> type).meta !== undefined;
}

// A function that takes the current state and and action that "reduces" the state to the next state.
// A readonly context (state object) is passed along that holds all state for sub reducers.
export type Reducer<S> =
  <P, M>(state: Readonly<S>, action?: Action | PayloadAction<P> | MetaAction<M>, context?: any) => S;

// A function of the Store that dispatches a synchronous action for handling by a reducer.
export type Dispatch = (action: Action) => void;

// A function of the Store that exposes its methods to the supplied AsyncAction function.
export type DispatchAsync<T> = (action: AsyncAction<T>) => PromiseLike<T>;

export type MakeAsyncAction<T, F> = (x: F) => AsyncAction<T>;

export type DispatchAsync2<T> = <F>(store: Store<T>, ...rest: any[]) => PromiseLike<T>;

// A function of the Store that gets the current state of the store.
export type GetState<T> = () => T;

// A function of the Store that allows a consumer to subscribe to the next state.
// This is a wrapper of the Rxjs subscribe method.
export type Subscribe<T> = (observerOrNext: PartialObserver<T> | ((value: T) => void), error?: (error: Error) => void,
  complete?: () => void) => Subscription;

// The store is an object of functions that can dispatch actions and async action, get the current state, and allows a
// consumer to subscribe and be notified when state changes.
export interface Store<T> {
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  dispatch: Dispatch;
  dispatchAsync: DispatchAsync<T>;
}

// Creates the store by accepting a top level reducer that will handle and delegate all actions to sub reducers.
export function createStore<T>(reducer: Reducer<T>): Store<T> {

  // call the reducer without state to trigger an initial state.
  let currentState: Readonly<T> = reducer(undefined, {type: ''});

  // The one and only dispatcher object that dispatches Actions.
  const dispatcher = new Subject<Action>();

  // The one and only state stream that consumers use to subscribe.
  const state$ = stateFunction(currentState, reducer);

  return {
    getState,
    subscribe,
    dispatch,
    dispatchAsync,
  };

  // The state function keeps the current state in the scan method, which, when an action is dispatched,
  // reduces it to the next state by calling the top level reducer passed into the createStore function.
  function stateFunction(initialState: T, reducer: Reducer<T>): Observable<T> {
    return dispatcher
      .pipe(scan((state: T, action: Action) => currentState = reducer(state, action), initialState))
      .pipe(share()); // Creates a "hot" stream that multi-casts the original stream to all subscribers.
  }

  function getState(): T {
    return currentState;
  }

  function subscribe(observerOrNext: ((value: T) => void),
                     error?: (error: Error) => void,
                     complete?: () => void): Subscription {
    return state$.subscribe(observerOrNext, error, complete);
  }

  function dispatch(action: Action): void {
    logger.debug(`Action => ${action.type}`);
    dispatcher.next(action);
  }

  function dispatchAsync(asyncAction: AsyncAction<T>): PromiseLike<T> {
    logger.debug(`AsyncAction => ${asyncAction.name}`);
    return asyncAction({getState, subscribe, dispatch, dispatchAsync});
  }

}
