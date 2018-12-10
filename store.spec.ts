import {createStore, Store, Action, AsyncAction} from './store';
import * as chai from 'chai';

chai.should();

// Test action creator
export let increment = () => ({type: 'INCREMENT'});

function asyncAction() : AsyncAction<number> {
  return async function asyncAction({dispatch, getState}): Promise<void> {
    return new Promise<void>(resolve => {
       setTimeout(() => {
        let state = getState();
        dispatch(increment());
         resolve();
      }, 1000)
    })
  }
}

// Test reducer
function incrementReducer(state = 0, action: Action, context: any): number {
  context.a = 1;
  if (action.type === 'INCREMENT') {
    return state + 1;
  }
  return state;
};

describe('Store', () => {

  let store: Store<number>;
  beforeEach(() => store = createStore(incrementReducer));

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
    });

    describe('#dispatchAsync', () => {
      it('Should dispatch', async () => {
        store.subscribe(() => undefined);
        await store.dispatchAsync(asyncAction());
        return store.getState().should.equal(1);
      });
    });

  });

});
