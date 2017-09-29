import {createStore, Store, Action} from './store';
import * as chai from 'chai';

chai.should();

// Test action creator
export let increment = () => ({type: 'INCREMENT'});

interface State {
  readonly id: string;
  number: number;
}

// Test reducer
function incrementReducer(state: State = {id: 'test', number: 0}, action: Action): State {
  if (action.type === 'INCREMENT') {
    return {...state, number: state.number + 1}
  }
  return state;
}

describe('Store', () => {

  let store: Store<State>;
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
      it('Should getState', () => store.getState().number.should.equal(0));
    });

    describe('#dispatch', () => {
      it('Should dispatch', () => {
        store.subscribe(() => undefined);
        store.dispatch(increment());
        store.getState().number.should.equal(1);
      });
    });

  });

});
