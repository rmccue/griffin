export const ACTIVATE_PLUGIN = 'ACTIVATE_PLUGIN';
export const DEACTIVATE_PLUGIN = 'DEACTIVATE_PLUGIN';

export interface ActivatePluginAction {
	type: typeof ACTIVATE_PLUGIN,
	payload: {
		id: string;
	}
}

export interface DeactivatePluginAction {
	type: typeof DEACTIVATE_PLUGIN,
	payload: {
		id: string;
	}
}

export type PreferencesAction =
	ActivatePluginAction |
	DeactivatePluginAction;
