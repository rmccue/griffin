import { Slot } from '@humanmade/react-slot-fill';
import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router';

import Thread from './Thread';
import { getThreadUpdateTimes } from '../../selectors/threads';
import { Thread as ThreadType } from '../../../common/types';

import './index.css';
import { RootState } from '../../reducers';

interface Props {
	items: ThreadType[],
}

type SelectionState = {
	[ idx: number ]: boolean;
};

export function ThreadList( props: Props & ReturnType<typeof mapStateToProps> ) {
	const { items, updateTimes } = props;

	const [ current, setCurrent ] = useState<Number | null>( null );
	const [ selected, setSelected ] = useState<SelectionState>( {} );

	const history = useHistory();
	const onOpen = ( item: ThreadType ) => {
		history.push( `/thread/${ item.id }` );
	};

	const sortedItems = reverse( sortBy( items, item => updateTimes[ item.id ] ) );

	return (
		<ol className="ThreadList">
			<Slot name="ThreadList.start" />
			{ sortedItems.map( ( item, idx ) => (
				<Thread
					key={ item.id }
					current={ idx === current }
					item={ item }
					selected={ !! selected[ idx ] }
					onDeselect={ () => setSelected( { ...selected, [ idx ]: false } ) }
					onOpen={ () => onOpen( item ) }
					onSetCurrent={ () => setCurrent( idx ) }
					onSelect={ () => setSelected( { ...selected, [ idx ]: true } ) }
				/>
			) ) }
			<Slot name="ThreadList.end" />
		</ol>
	)
}

const mapStateToProps = ( state: RootState, props: Props ) => {
	return {
		updateTimes: getThreadUpdateTimes( state, props ),
	};
};

export default connect( mapStateToProps )( ThreadList );
