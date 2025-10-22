# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Construct 3 plugin** that integrates the Steamworks SDK. It provides game developers with easy-to-use events and actions for Steam features (leaderboards, friends, networking, DLC checks, etc.) through a hybrid architecture:

- **JavaScript layer** (`src/`) - Construct 3 plugin that runs in the game runtime
- **C++ native extension** (`wrapper-extension/`) - DLL that wraps Steamworks SDK API calls

The project intentionally keeps core features minimal and encourages the community to build "companion plugins" for advanced Steam API features rather than bloating the core plugin.

## Build Commands

```bash
# Install dependencies
npm install

# Build both C++ DLL and JavaScript addon
npm run build

# Build only JavaScript addon (reuses existing DLL)
npm run build-addon

# Build only C++ DLL
npm run build-dll

# Start development server with live reload on http://localhost:3000
npm run dev
```

**Steamworks SDK Setup Required:**
- Download the Steamworks SDK separately from https://partner.steamgames.com/doc/sdk
- Extract the `sdk` subfolder to `wrapper-extension/steamworks-sdk/`
- Verify that `wrapper-extension/steamworks-sdk/public/steam/steam_api.h` exists
- The C++ build will fail without this

**C++ Build Requirements:**
- Visual Studio 2022 or newer (Community edition is free)
- If build fails, check `build-dll.js` - it attempts to find MSBuild path automatically

## Core Architecture

### Message-Passing System

The plugin uses **asynchronous bidirectional messaging** between JavaScript and C++:

```
JavaScript (instance.js)                    C++ DLL (WrapperExtension.cpp)
        |                                            |
        | SendWrapperExtensionMessageAsync()         |
        |-------------- message id + params -------->|
        |                + asyncId                   |
        |                                            | HandleWebMessage()
        |                                            | routes to handler
        |                                            | calls Steamworks API
        |                                            | registers callback
        |                                            |
        |                                            | (Steam callback fires)
        |<------------ JSON response + asyncId ------|
        |                                            | SendAsyncResponse()
   Promise resolves                                  |
   Store result by tag                               |
   Trigger OnRequestResult                           |
```

**Key files:**
- `src/instance.js` - Message sending, result storage, event triggers
- `wrapper-extension/WrapperExtension.cpp` - Message routing, Steamworks API calls
- `wrapper-extension/SteamCallbacks.cpp` - Async callback handling

### Tag-Based Result System

Instead of individual triggers per feature, uses a **generic tag system**:

```javascript
// When request completes
this._steamResult.set("UPLOADLEADERBOARDSCORE", data)
this._triggerTag = "UPLOADLEADERBOARDSCORE"
this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult)

// In events
OnRequestResult → check RequestResult("UploadLeaderboardScore")
```

This scales elegantly without adding new conditions/expressions for every feature.

### Configuration-Driven Code Generation

**`src/pluginConfig.js` is the source of truth.** The build system auto-generates:
- ACE definitions (actions/conditions/expressions)
- `addon.json` manifest
- Language files
- Runtime code structure

To add new features, start by modifying `pluginConfig.js`.

## Adding New Steamworks Features

### Step 1: Define in pluginConfig.js

```javascript
MyNewFeature: {
  category: "general",           // or create new aceCategories entry
  forward: "_MyNewFeature",      // method name in instance.js
  autoScriptInterface: true,     // expose to script interface
  isAsync: true,                 // if waiting for Steam callback
  params: [
    { id: "param1", name: "Parameter", type: "string" }
  ],
  listName: "My feature action",
  displayText: "Do my feature with [i]{0}[/i]",
  description: "Description shown in event sheet picker"
}
```

### Step 2: Implement JavaScript handler (src/instance.js)

```javascript
async _MyNewFeature(param1) {
  const tag = this._Tag.MyNewFeature  // Add to _Tag object
  try {
    const result = await this.SendWrapperExtensionMessageAsync(
      "my-message-id",
      [param1]
    )

    const isOk = result["isOk"]
    if (isOk) {
      this._steamResult.set(tag.toUpperCase(), result["data"])
      this._triggerTag = tag.toUpperCase()
      this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult)
    } else {
      this._steamError.set(tag.toUpperCase(), result["error"])
      this._triggerTag = tag.toUpperCase()
      this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError)
    }
  } catch (e) {
    console.error("MyNewFeature error:", e)
  }
}
```

### Step 3: Add C++ handler (wrapper-extension/WrapperExtension.cpp)

```cpp
// In HandleWebMessage(), add routing:
else if (messageId == "my-message-id") {
  const std::string& param = params[0].GetString();
  OnMyFeatureMessage(param, asyncId);
}

// Implement handler:
void WrapperExtension::OnMyFeatureMessage(const std::string& param, double asyncId) {
  // For synchronous operations:
  bool success = ISteamSomeInterface()->SomeFunction(param);
  rapidjson::Document response;
  response.SetObject();
  response.AddMember("isOk", success, response.GetAllocator());
  SendAsyncResponse(response, asyncId);

  // For async operations with callbacks:
  SteamAPICall_t hSteamAPICall = ISteamInterface()->AsyncFunction(param);
  m_CallbackMyFeature.Set(hSteamAPICall, this, &WrapperExtension::OnMyFeatureCallback);
}

// Callback handler:
void WrapperExtension::OnMyFeatureCallback(MyResult_t* pResult, bool bIOFailure) {
  rapidjson::Document response;
  response.SetObject();
  response.AddMember("isOk", !bIOFailure && pResult->m_eResult == k_EResultOK, response.GetAllocator());
  // Add result data...
  SendAsyncResponse(response, pResult->m_asyncId);
}
```

**Data type constraints:** Only `bool`, `number`, and `string` can cross the DLL boundary. For complex data, serialize as JSON strings.

### Step 4: Build and test

```bash
npm run build
npm run dev  # Start dev server
```

In Construct 3: Add addon via URL `http://localhost:3000/addon.json`

File changes auto-rebuild (JavaScript). DLL changes require restarting the dev server.

## Development Workflow

### Testing without full export

Use **WebView2 remote debugging** to avoid rebuild cycles:
1. Enable remote debugging in C3 project settings
2. Make JavaScript changes
3. Refresh preview (no re-export needed)

Note: DLL changes still require rebuild and restart.

### ACE Organization

Actions/Conditions/Expressions are organized by category:
- `leaderboard` - Leaderboard operations
- `friends` - Friend list & persona operations
- `app` - App/DLC checks
- `general` - Core operations
- `networkingMessages` - P2P networking

### P2P Networking Pattern

P2P uses a **polling pattern** since messages arrive asynchronously:
1. Game calls "Enable networking messages" action
2. `Tick()` loop continuously calls `receive-messages` on DLL
3. DLL returns pending messages
4. Messages stored and triggers fired
5. Game reads via expressions

## Important Notes

### Companion Plugin Pattern

To add advanced Steam features without modifying this core plugin:
1. Start with the basic wrapper extension SDK
2. **Change the plugin ID** (critical to avoid conflicts)
3. Integrate Steamworks SDK the same way (see `framework.h`)
4. Add features that directly access Steam APIs (skip init/shutdown)
5. Users add both plugins to their project

This avoids obligating maintainers to support every Steam API feature.

### Rate Limiting

Steam leaderboard uploads are **throttled**. If updates fail to take effect, this is likely why. See: https://partner.steamgames.com/doc/api/ISteamUserStats#UploadLeaderboardScore

The plugin uses `UpdateForce` mode (always update score). Check locally before uploading if you want keep-best behavior.

### Platform Support

Currently **Windows x64 only**. The 32-bit version exists in older releases but is not actively maintained. Other platforms would require separate DLL builds.

### Key Files

- `src/pluginConfig.js` - Source of truth for all ACEs and metadata
- `src/instance.js` - Runtime logic, message handlers, state management
- `wrapper-extension/WrapperExtension.cpp` - Message routing and Steam API calls
- `wrapper-extension/SteamCallbacks.cpp` - Async callback handling
- `build.js` - Code generation and packaging
- `build-dll.js` - C++ compilation via MSBuild

## Project Requirements

Must include the **official Construct 3 Steamworks WebView2 plugin** alongside this plugin in projects.
