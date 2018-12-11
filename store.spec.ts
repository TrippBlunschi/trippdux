import {createStore, Store, Action, AsyncAction} from './store';
import * as chai from 'chai';

chai.should();

// Test action creator
export let increment = () => ({type: 'INCREMENT'});

function asyncAction(): AsyncAction<number> {
  return async function asyncAction({dispatch}: Store<number>): Promise<void> {
    return new Promise<void>(resolve =>
       setTimeout(() => {
        dispatch(increment());
        resolve();
      }),
    );
  };
}

// Test reducer
function incrementReducer(state: number, action: Action, context: any): number {

  if (action.type === 'INCREMENT') {
    return state + 1;
  }
  return state;
}

describe('Store', () => {

  let store: Store<number>;
  beforeEach(() => store = createStore(incrementReducer, 0));

  describe('#createStore', () => {

    it('Should create store.', () => store.should.be.an('object'));

    it('Should have correct keys.', () =>
      store.should.have.keys('getState', 'subscribe', 'dispatch', 'dispatchAsync'));

    describe('#subscribe', () => {
      it('Should subscribe', () => store.subscribe(() => undefined).should.have.property('unsubscribe'));

      it('should emit state', () => {
        store.subscribe(state => state.should.equal(0));
      });

      it('should emit next state', () => {
        store.subscribe(state => undefined);
        store.dispatch(increment());
        store.subscribe(state => state.should.equal(1));
      });

      it('should receive state when subscribed', () => {
        let data = 0;
        store.subscribe(state => data = state);
        store.dispatch(increment());
        data.should.equal(1);
      });

      it('should not receive state when unsubscribed', () => {
        let data = 0;
        let subscription = store.subscribe(state => data = state);
        store.dispatch(increment());
        subscription.unsubscribe();
        store.dispatch(increment());
        data.should.equal(1);
      });
    });

    describe('#getState', () => {
      it('Should getState', () => store.getState().should.equal(0));
    });

    describe('#dispatch', () => {
      it('Should dispatch', () => {
        store.subscribe(() => undefined);
        store.dispatch(increment());
        store.getState().should.equal(1);
      });
      it('Should dispatch twice', () => {
        store.subscribe(() => undefined);
        store.dispatch(increment());
        store.dispatch(increment());
        store.getState().should.equal(2);
      });
    });

    describe('#dispatchAsync', () => {
      it('Should dispatch', async() => {
        store.subscribe(() => undefined);
        await store.dispatchAsync(asyncAction());
        return store.getState().should.equal(1);
      });
    });

  });

});
