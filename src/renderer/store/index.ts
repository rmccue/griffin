import { applyMiddleware, createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { persistReducer, persistStore } from 'redux-persist';

import storage from './storage';
import { rootReducer, RootState } from '../reducers';

const persistConfig = {
	key: 'root',
	keyPrefix: '',
	debug: true,
	storage
};

const persistedReducer = persistReducer( persistConfig, rootReducer );

const configureStore = ( initialState?: RootState ): Store<RootState | undefined> => {
	const middlewares: any[] = [];
	const enhancer = composeWithDevTools( applyMiddleware( ...middlewares ) );
	return createStore( persistedReducer, initialState, enhancer );
};

const store = configureStore();
export default store;
export const persistedStore = persistStore( store );

if ( typeof module.hot !== 'undefined' ) {
	module.hot.accept( '../reducers', () => {
		store.replaceReducer( require('../reducers').rootReducer )
	} );
}
