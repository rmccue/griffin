# Griffin

An email client.


## Development

```sh
git clone https://github.com/rmccue/griffin.git
cd griffin
yarn install

# In three separate tabs:
# Build main (Node process)
yarn run start-main-dev

# Build renderer (browser process)
yarn run start-renderer-dev

# Run Electron and restart on main changes
yarn run start-electron-dev
```

### Development on Windows

When running on Windows, WSL2 is required for your build environment.

After installing Griffin's dependencies and starting the main and renderer build process, you then need to install Electron as a Windows application.

The easiest way to do this is to download [electron-v8.3.2-win32-x64.zip](https://github.com/electron/electron/releases/download/v8.3.2/electron-v8.3.2-win32-x64.zip). Extract this to a directory somewhere (carefully, as it's a tarbomb; ensure you're cd'd into an empty directory if not using a GUI).

Once that's done, you can then start Electron with the following (inside a WSL2 shell):

```sh
# Set the path to the mounted path in WSL of the directory you extracted
# Electron to. This *must* be a mounted path from your Windows filesystem,
# otherwise Windows will prevent electron from running with obscure errors/
env ELECTRON_OVERRIDE_DIST_PATH=/mnt/f/Griffin/electron yarn run start-electron-dev
```


## Credits

Incorporates work from [Imapflow](https://github.com/andris9/imapflow), licensed under the AGPL v3 or later. Copyright 2020 Andris Reinman.

Incorporates work from [electron-react-typescript](https://github.com/Robinfr/electron-react-typescript), licensed under the MIT license. Copyright 2018-2020 R. Franken.

Icon based on [Griffin](https://thenounproject.com/search/?q=griffin&i=1881913) by Icons Producer from [the Noun Project](http://thenounproject.com/), licensed under CC-BY.