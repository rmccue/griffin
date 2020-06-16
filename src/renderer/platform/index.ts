import type { ICONS as ICON_base } from './mac';

const platform = process.platform === 'win32' ? require( './windows' ) : require( './mac' );

export const ICONS: typeof ICON_base = platform.ICONS;
