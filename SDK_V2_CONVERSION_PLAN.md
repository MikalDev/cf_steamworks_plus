# Construct 3 SDK V2 Conversion Plan

This document outlines the steps to convert the Steamworks Plus addon from SDK V1 to SDK V2.

## Background

- SDK V2 was introduced in Construct 3 r391 (May 2024)
- SDK V1 support was retired in r450+ and will be completely removed by June 2025
- Only the c3runtime files need changes; editor files and wrapper extension remain the same

## Current Structure (SDK V1)

The current addon uses a meta-framework pattern where `plugin.js` contains everything:
- Plugin class, Type class, Instance class
- Actions, Conditions, Expressions definitions via PLUGIN_INFO object
- Script interface generation
- All instance methods (_SetLeaderboard, _UploadLeaderboardScore, etc.)

Empty placeholder files: `actions.js`, `conditions.js`, `expressions.js`, `instance.js`, `type.js`

## Target Structure (SDK V2)

SDK V2 uses ES modules with separate files that import each other:

```
src/
├── aces.json              (unchanged)
├── addon.json             (update: add sdk-version, min-construct-version, update file-list)
├── editor.js              (unchanged for editor-side)
├── icon.svg               (unchanged)
├── lang/en-US.json        (unchanged)
├── c3runtime/
│   ├── main.js            (NEW: entry point that imports all modules)
│   ├── plugin.js          (rewrite: minimal plugin class)
│   ├── type.js            (rewrite: minimal type class)
│   ├── instance.js        (rewrite: main instance logic)
│   ├── actions.js         (rewrite: action methods)
│   ├── conditions.js      (rewrite: condition methods)
│   └── expressions.js     (rewrite: expression methods)
└── Steam_plus_x64.ext.*   (unchanged)
```

---

## Conversion Steps

### Step 1: Update `addon.json`

Add SDK V2 required fields:

```json
{
  "is-c3-addon": true,
  "sdk-version": 2,
  "min-construct-version": "r401",
  "type": "plugin",
  "name": "Steamworks Plus",
  "id": "cf_steamworks_plus",
  "version": "1.9.0",
  ...
  "file-list": [
    "c3runtime/main.js",
    "c3runtime/plugin.js",
    "c3runtime/type.js",
    "c3runtime/instance.js",
    "c3runtime/conditions.js",
    "c3runtime/actions.js",
    "c3runtime/expressions.js",
    "lang/en-US.json",
    "aces.json",
    "addon.json",
    "icon.svg",
    "editor.js",
    "Steam_plus_x64.ext.dll",
    "Steam_plus_x64.ext.so"
  ]
}
```

### Step 2: Create `c3runtime/main.js`

New entry point that imports all modules:

```javascript
import "./plugin.js";
import "./type.js";
import "./instance.js";
import "./conditions.js";
import "./actions.js";
import "./expressions.js";
```

### Step 3: Rewrite `c3runtime/plugin.js`

SDK V2 format - minimal plugin class:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus = class cf_steamworks_plusPlugin extends globalThis.ISDKPluginBase
{
    constructor()
    {
        super();
    }
};
```

### Step 4: Rewrite `c3runtime/type.js`

SDK V2 format - minimal type class:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Type = class cf_steamworks_plusType extends globalThis.ISDKObjectTypeBase
{
    constructor()
    {
        super();
    }

    _onCreate()
    {
    }
};
```

### Step 5: Rewrite `c3runtime/instance.js`

SDK V2 format - main instance with wrapper extension support:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Instance = class cf_steamworks_plusInstance extends globalThis.ISDKInstanceBase
{
    constructor()
    {
        super({ wrapperComponentId: "cf-steam-plus" });

        this._isWrapperExtAvailable = this._isWrapperExtensionAvailable();

        // Tag constants
        this._Tag = {
            DownloadLeaderboardScores: "DownloadLeaderboardScores",
            IsDlcInstalled: "IsDlcInstalled",
            SetLeaderboard: "SetLeaderboard",
            UploadLeaderboardScore: "UploadLeaderboardScore",
            GetFriendPersonaName: "GetFriendPersonaName",
            SendMessageToUser: "SendMessageToUser",
            OnNetworkingMessage: "OnNetworkingMessage",
            OnSessionRequest: "OnSessionRequest",
            AcceptSessionWithUser: "AcceptSessionWithUser",
            GetFriendsNameId: "GetFriendsNameId",
        };

        // For trigger results
        this._steamResult = new Map();
        this._steamError = new Map();
        this._enableNetworking = false;
        this._triggerTag = "";

        const properties = this._getInitProperties();
        if (properties)
        {
            // Read properties if needed
        }

        if (this._isWrapperExtAvailable)
        {
            console.log("Steamworks+ wrapper extension available");
            this._startTicking();
            this._addWrapperExtensionMessageHandler("session-request", e => this._OnSessionRequestMessage(e));
        }
    }

    _release()
    {
        super._release();
    }

    async _tick()
    {
        if (this._enableNetworking)
        {
            const tag = this._Tag.OnNetworkingMessage;
            const result = await this._sendWrapperExtensionMessageAsync("receive-messages", [0]);
            const isOk = result["isOk"];

            if (isOk)
            {
                const nMessages = parseInt(result["nMessages"]);
                if (nMessages > 0)
                {
                    const messages = JSON.parse(result["messages"]);
                    for (let i = 0; i < nMessages; i++)
                    {
                        const message = messages[i.toString()];
                        this._steamResult.set(tag.toUpperCase(), JSON.stringify(message));
                        this._triggerTag = tag.toUpperCase();
                        this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
                    }
                }
            }
            else
            {
                this._steamResult.set(tag.toUpperCase(), "error:poll-networking");
                this._triggerTag = tag.toUpperCase();
                this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
            }
        }
    }

    // Internal helper to check availability
    _isAvailable()
    {
        return this._isWrapperExtAvailable;
    }

    _saveToJson()
    {
        return {
            // data to be saved for savegames
        };
    }

    _loadFromJson(o)
    {
        // load state for savegames
    }

    // Session request message handler
    _OnSessionRequestMessage(e)
    {
        const tag = this._Tag.OnSessionRequest;
        const isOk = e["isOk"];

        if (!isOk)
        {
            this._steamError.set(tag.toUpperCase(), "error");
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
            console.log("session request error", e);
            return;
        }

        console.log("session request", e);
        this._steamResult.set(tag.toUpperCase(), JSON.stringify(e));
        this._triggerTag = tag.toUpperCase();
        this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnSessionRequest);
    }
};
```

### Step 6: Rewrite `c3runtime/actions.js`

SDK V2 format - action methods on Acts object:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Acts =
{
    async FindLeaderboard(leaderboardName)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.SetLeaderboard;
        const result = await this._sendWrapperExtensionMessageAsync("find-leaderboard", [leaderboardName]);

        this._triggerLeaderboardName = leaderboardName;

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), { leaderboardName, result: 1 });
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), { leaderboardName, result: 0 });
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }

        return isOk;
    },

    async UpdloadLeaderboardScore(score)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.UploadLeaderboardScore;
        const result = await this._sendWrapperExtensionMessageAsync("upload-leaderboard-score", [score]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), { score, result: 1 });
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), { score, result: 0 });
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    async DownloadLeaderboardScores(nStart, nEnd, mode)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.DownloadLeaderboardScores;
        const requestMode = mode === 0 ? "global" : mode === 1 ? "global-around-user" : "friends";

        const result = await this._sendWrapperExtensionMessageAsync("download-leaderboard-scores", [nStart, nEnd, requestMode]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), result["scores"]);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), `error:${tag}: check if user has score, or if leaderboard exists`);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    async IsDlcInstalled(appId)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.IsDlcInstalled;
        const result = await this._sendWrapperExtensionMessageAsync("is-dlc-installed", [appId]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), result["isInstalled"] ? 1 : 0);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), `error:${tag}:`);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    async GetFriendPersonaName(steamId)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.GetFriendPersonaName;
        const result = await this._sendWrapperExtensionMessageAsync("get-friend-persona-name", [steamId]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), result["friendPersonaName"]);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), `error:${tag}: no name found`);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    async SendMessageToUser(identityRemote, message)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.SendMessageToUser;
        const result = await this._sendWrapperExtensionMessageAsync("send-message-to-user", [identityRemote, message]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), "");
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), result["error"]);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    EnableNetworking(enable)
    {
        if (!this._isAvailable())
            return;

        this._enableNetworking = enable;
        this._sendWrapperExtensionMessageAsync("enable-networking", [enable]);
    },

    async AcceptSessionWithUser(remoteSteamId)
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.AcceptSessionWithUser;
        const result = await this._sendWrapperExtensionMessageAsync("accept-session-from-user", [remoteSteamId]);

        const isOk = result["isOk"];
        if (isOk)
        {
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), "error");
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    },

    async GetFriendsNameId()
    {
        if (!this._isAvailable())
            return;

        const tag = this._Tag.GetFriendsNameId;
        const result = await this._sendWrapperExtensionMessageAsync("get-friends-name-id");

        const isOk = result["isOk"];
        if (isOk)
        {
            this._steamResult.set(tag.toUpperCase(), result["friends"]);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
        }
        else
        {
            this._steamError.set(tag.toUpperCase(), `error:${tag}: no name found`);
            this._triggerTag = tag.toUpperCase();
            this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
        }
    }
};
```

### Step 7: Rewrite `c3runtime/conditions.js`

SDK V2 format - condition methods on Cnds object:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Cnds =
{
    OnRequestResult(tag)
    {
        const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
        return match;
    },

    OnRequestError(tag)
    {
        const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
        return match;
    },

    OnSessionRequest()
    {
        return true;
    }
};
```

### Step 8: Rewrite `c3runtime/expressions.js`

SDK V2 format - expression methods on Exps object:

```javascript
const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Exps =
{
    RequestData(tag)
    {
        const upCaseTag = tag.toUpperCase();
        if (this._steamResult.has(upCaseTag))
        {
            return this._steamResult.get(upCaseTag);
        }
        else
        {
            console.warn("[Steamworks+] No result for tag", upCaseTag);
            return "";
        }
    },

    RequestError(tag)
    {
        const upCaseTag = tag.toUpperCase();
        if (this._steamError.has(upCaseTag))
        {
            return this._steamError.get(upCaseTag);
        }
        else
        {
            console.warn("[Steamworks+] No error for tag", upCaseTag);
            return "";
        }
    }
};
```

---

## Key API Changes (V1 → V2)

| SDK V1 | SDK V2 |
|--------|--------|
| `self.C3` | `globalThis.C3` |
| `C3.SDKInstanceBase` | `globalThis.ISDKInstanceBase` |
| `C3.SDKPluginBase` | `globalThis.ISDKPluginBase` |
| `C3.SDKTypeBase` | `globalThis.ISDKObjectTypeBase` |
| `SetWrapperExtensionComponentId()` | `super({ wrapperComponentId: "..." })` |
| `IsWrapperExtensionAvailable()` | `this._isWrapperExtensionAvailable()` |
| `SendWrapperExtensionMessageAsync()` | `this._sendWrapperExtensionMessageAsync()` |
| `AddWrapperExtensionMessageHandler()` | `this._addWrapperExtensionMessageHandler()` |
| `this._StartTicking()` | `this._startTicking()` |
| `async Tick()` | `async _tick()` |
| `this.Trigger()` | `this._trigger()` |
| `SaveToJson()` | `_saveToJson()` |
| `LoadFromJson()` | `_loadFromJson()` |
| `Release()` | `_release()` |

---

## Testing Checklist

After conversion:

1. [ ] Addon loads in Construct 3 r401+
2. [ ] No console errors on project load
3. [ ] Wrapper extension detected (check console for "Steamworks+ wrapper extension available")
4. [ ] FindLeaderboard action works
5. [ ] UploadLeaderboardScore action works
6. [ ] DownloadLeaderboardScores action works
7. [ ] IsDlcInstalled action works
8. [ ] GetFriendPersonaName action works
9. [ ] SendMessageToUser action works
10. [ ] EnableNetworking action works
11. [ ] AcceptSessionWithUser action works
12. [ ] GetFriendsNameId action works
13. [ ] OnRequestResult trigger fires correctly
14. [ ] OnRequestError trigger fires correctly
15. [ ] OnSessionRequest trigger fires correctly
16. [ ] RequestData expression returns correct data
17. [ ] RequestError expression returns correct data
18. [ ] Savegames work (save/load state)

---

## Sources

- [Porting to Addon SDK v2](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/porting-addon-sdk-v2)
- [Runtime scripts in the Addon SDK v2](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/runtime-scripts/sdk-v2)
- [Addon SDK v2 Forum Thread](https://www.construct.net/en/forum/construct-3/plugin-sdk-10/addon-sdk-v2-182122)
- [Scirra/Construct-Addon-SDK GitHub](https://github.com/Scirra/Construct-Addon-SDK)
- Official wrapper extension plugin example: `plugin-sdk/wrapperExtensionPlugin/`
