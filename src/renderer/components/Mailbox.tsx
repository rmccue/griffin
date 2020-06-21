import React from 'react';
import { connect } from 'react-redux';

import ThreadList from './ThreadList';
import { Thread } from '../../common/types';
import { query } from '../connector';
import { RootState } from '../reducers';

interface Props {
	items: Thread[];
}

class Mailbox extends React.Component<Props> {
	componentDidMount() {
		if ( ! this.props.items.length ) {
			query();
		}
	}

	render() {
		return (
			<ThreadList
				items={ this.props.items }
			/>
		);
	}
}

const mapStateToProps = ( state: RootState ) => ( {
	items: state.threads.items,
} );

export default connect( mapStateToProps )( Mailbox );
