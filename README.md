# About
- Open source repo for the Construct 3 Steam plus addon
- To just get the addon go to the official C3 addon site or https://github.com/MikalDev/cf_steamworks_plus/releases

To build the addon and dll (also see #Build below for details on other tools neede)

```
npm i 
npm run build // builds both addon and dll
npm run build-addon // only builds addon, uses existing dll
npm run build-dll // oly builds dll
```

To run the dev server, run

```
npm i
node ./dev.js
```

The build uses the pluginConfig file to generate everything else.

The main files you may want to look at would be instance.js and scriptInterface.js

# Scirra notes on developing a companion addon

We are providing the source to this Construct plugin/extension for maximum flexibility for developers publishing Construct content. However this repository is not developed like a traditional open-source project, and in some cases you may be better off developing a separate "companion" plugin rather than modifying this one. Please read this guide if you plan on modifying this plugin.

A secondary "companion" plugin can integrate the Steamworks SDK and make API calls, but can assume the SDK is already initialized by this plugin. The companion plugin can then be developed entirely independently, and users will be aware that responsibility for maintenance of that plugin lies with someone else.

For example if you want to integrate Steam Workshop features, that involes a broad set of APIs in the [ISteamUGC Interface](https://partner.steamgames.com/doc/api/ISteamUGC). If you submit a PR that adds all of those features to this plugin, we will likely reject it, since it would essentially obligate us to provide long-term commercial support for it. However you can make a new plugin that provides all those features and can be used alongside this plugin.

In this way a set of companion plugins could be developed by the community, providing access to more of the very large API surface of the Steamworks SDK, without obligating Scirra Ltd to provide long-term support for it. Part of the reason we are sharing this code is also to provide an example of how to write the necessary code for such plugins.

Our intent is for this plugin to provide just a small core of essential features that the vast majority of games are likely to make use of. If you have a small, essential, well-written and easily-maintainable change for this plugin, you can submit a PR for that and we may accept such contributions. However we may well advise you to create a separate plugin instead. We reserve the right to reject PRs at our discretion and without providing any reason beyond the explanation provided here.

## Creating a companion plugin

If you want to create a plugin that makes use of more of the Steam API, you'll want to do the following:

- Start with the basic wrapper extension SDK.
- **Change the Construct plugin ID.** Never use the same plugin ID for different plugins or you risk severe compatibility problems and project corruption.
- Rename the plugin, e.g. to *Steam Workshop*.
- Integrate the Steamworks SDK in the same way this wrapper extension does - see *framework.h* for the include code.
- Add features that directly access Steam API features, skipping initialization and shutdown.
- In Construct, add both this plugin and your companion plugin to your project. This plugin will handle initialization for you and then your plugin will provide additional features.

## Build

To build the wrapper extension, you will need:

- [Visual Studio 2022](https://visualstudio.microsoft.com/downloads/) or newer (the *Community* edition is free)
- The [Steamworks SDK](https://partner.steamgames.com/doc/sdk) - download and extract the *sdk* subfolder in the *steamworks-sdk* subfolder such that the file `steamworks-sdk\public\steam\steam_api.h` exists.

## Add new functions
- Create new 'group' for different features (e.g. 'workshop')
- Create ACEs and functions in the group in the addon (JS) (pluginConfig.js and instance.js)
- Most ACEs will send a async message to the DLL and await a response
- In the DLL (c++) add a new function for the incoming message, make the steamworks api call, for return data or status usually add a result callback function
- Callback function can format the data as a JSON string and sent it back to the addon, there are limited data types that can be send between addon and DLL.
- In the addon (JS) On response store data in the RequestResult map as a JSON string, using the request tag trigger onRequestResult
- In events use a JSON object to parse the data and then use the data as needed. See JSON object documentation for getting data, looping, etc.

- Instead of making a new trigger and new request result condition and expression for every request, use the tag system for the condition and result
- Will add another condition for the error case

# Usage
## Requirements
- Must also include the C3 official steamworks webview 2 plug-in
## ACEs information
### Leaderboards
- See steaworks web details on leaderboards, how to create and observe a leaderboard using the steamworks web interface
- If you want to use the KeepBest method for the leaderboard, create it with the descending score option (if you change it later after you create it, it may not work)
- Uploading scores is rate limited / throttled, so if you see updates failing to take effect this may be why (learned it the hard way): https://partner.steamgames.com/doc/api/ISteamUserStats#UploadLeaderboardScore
- The result is returned as a JSON string array which can be parsed by the C3 JSON object.

# Testing
Use the webiew2 remote viewing option, so you don't to rebuild and export each time. This has been tested with project and adddon (JS) changes, but not changes to the dll (C++).

# Release notes
- 1.0.0 original release
- 1.1.0 ACEs for Find Leaderboard (may change name to 'Set Current Leaderboard'), Upload Score to Leaderboard (current), Download Leaderboard, onRequestResult(tag), RequestResult(tag)