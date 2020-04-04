import { systemPreferences } from 'electron';

const allColors = [
	"alternate-selected-control-text",
	"control-background",
	"control",
	"control-text",
	"disabled-control-text",
	"find-highlight",
	"grid",
	"header-text",
	"highlight",
	"keyboard-focus-indicator",
	"label",
	"link",
	"placeholder-text",
	"quaternary-label",
	"scrubber-textured-background",
	"secondary-label",
	"selected-content-background",
	"selected-control",
	"selected-control-text",
	"selected-menu-item-text",
	"selected-text-background",
	"selected-text",
	"separator",
	"shadow",
	"tertiary-label",
	"text-background",
	"text",
	"under-page-background",
	"unemphasized-selected-content-background",
	"unemphasized-selected-text-background",
	"unemphasized-selected-text",
	"window-background",
	"window-frame-text",
] as const;

type ColorName = typeof allColors[number];

export type ColorMap = {
	[ key in ColorName ]: string | null;
}

export function getAllColors() {
	return allColors.reduce<ColorMap>( ( colorMap, color ) => {
		try {
			colorMap[ color ] = systemPreferences.getColor( color );
		} catch ( err ) {
			colorMap[ color ] = null;
		}
		return colorMap;
	}, {} as ColorMap );
}
