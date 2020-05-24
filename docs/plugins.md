# Plugins

Griffin supports plugins in a similar style to VS Code.

Plugins placed into Griffin's plugin root will be automatically recognised and shown in the settings UI. The plugin root on macOS is at `~/Library/Application Support/Griffin/plugins`.


## Plugin structure

A plugin is a directory within the plugin root, with two required files: `package.json` and an entry point (typically `index.js`).


### package.json

Your package.json must contain the following fields:

* `publisher` (string): The publisher name.
* `name` (string): The plugin's name.

It may contain the following optional fields:

* `main` (string): Relative path to your entrypoint file. (Default is `index.js`)
* `description` (string): Description to be shown to the user in the settings panel.


### Entrypoint

Your entrypoint should export a single default React component. This component will be mounted into the tree inside the renderer.

Note: For performance and security reasons, plugins cannot run in the main process.


## Writing plugins

*Note: this section is incomplete*

Plugins can require the following modules directly from Griffin's dependencies:

* `react`

Plugins can also require components and utilities directly from the renderer, using the following prefixes:

* `@rmccue/griffin/components/*`: [React components](https://github.com/rmccue/griffin/tree/master/src/renderer/components)
* `@rmccue/griffin/reducers/*`: [Redux reducers](https://github.com/rmccue/griffin/tree/master/src/renderer/reducers)
* `@rmccue/griffin/selectors/*`: [Reselect selectors](https://github.com/rmccue/griffin/tree/master/src/renderer/selectors)
* `@rmccue/griffin/store/*`: [Redux store](https://github.com/rmccue/griffin/tree/master/src/renderer/store)
* `@rmccue/griffin/connector`: [Connector to the main process](https://github.com/rmccue/griffin/blob/master/src/renderer/connector.tsx)
* `@rmccue/griffin/slot-fill`: [SlotFill helpers](https://github.com/rmccue/griffin/blob/master/src/renderer/slot-fill.tsx)
