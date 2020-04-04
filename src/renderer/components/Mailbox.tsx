import React from 'react';
import { connect } from 'react-redux';

import ThreadList from './ThreadList';
import { Thread } from '../../common/types';
import { RootState } from '../reducers';

interface Props {
	items: Thread[];
}

const Mailbox = ( props: Props ) => (
	<ThreadList
		items={ props.items }
	/>
);

const mapStateToProps = ( state: RootState ) => ( {
	items: state.threads.items,
} );

export default connect( mapStateToProps )( Mailbox );
