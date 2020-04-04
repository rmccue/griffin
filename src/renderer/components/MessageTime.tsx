import classnames from 'classnames';
import React from 'react';
import { FormattedDate, FormattedTime, FormattedRelativeTime, FormatDateOptions } from 'react-intl';

interface Props {
	className?: string;
	// date?: boolean;
	short?: boolean;
	relative?: boolean;
	value: Date | string;
}

const DATE_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
};

const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
	day: 'numeric',
	month: 'short',
};

const TIME_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
	hour: 'numeric',
    minute: 'numeric',
};

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
	...DATE_ONLY_FORMAT,
	...TIME_ONLY_FORMAT,
};

export default function MessageTime( props: Props ) {
	const { relative, short, value } = props;
	const valueDate = new Date( value );
	const relTime = Math.floor( ( Date.now() - valueDate.getTime() ) / 1000 ) * -1;
	const isToday = ( new Date() ).toDateString() === valueDate.toDateString();

	const format = isToday ? TIME_ONLY_FORMAT : ( short ? SHORT_DATE_FORMAT : DATETIME_FORMAT );

	const className = classnames(
		'MessageTime',
		props.className,
	);

	return (
		<time
			className={ className }
		>
			<FormattedDate
				{ ...format }
				value={ value }
			/>
			{ relative && (
				<>
					{ ' (' }
					<FormattedRelativeTime
						value={ relTime }
						updateIntervalInSeconds={ 60 }
					/>
					{ ')' }
				</>
			) }
		</time>
	);
}
