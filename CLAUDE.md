# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Steamworks Plus**, a Construct 3 addon that provides extended Steamworks SDK functionality. It's a companion plugin to the official C3 Steamworks plugin, providing additional Steam API features like leaderboards, DLC checks, friends lists, and P2P networking.

## Build Commands

```bash
npm i                  # Install dependencies
npm run build          # Build DLL (Windows only, requires Visual Studio 2022)
npm run build-dll      # Same as above
node ./dev.js          # Run dev server for testing
```

## Build Requirements

- **Windows DLL**: Visual Studio 2022 with MSBuild
- **Steamworks SDK**: Must be extracted to `wrapper-extension/steamworks-sdk/` such that `steamworks-sdk/public/steam/steam_api.h` exists
- **Linux .so**: Requires cmake, then use `patchelf --set-rpath '$ORIGIN'` to fix RPATH

## Architecture

### Two-Part Plugin System

1. **JavaScript Addon** (`src/`): Construct 3 plugin that runs in the browser/WebView
2. **Native Extension** (`wrapper-extension/`): C++ DLL/SO that interfaces with Steamworks SDK

### Communication Flow

JavaScript addon sends async messages to the C++ extension via `SendWebMessage()`. The extension processes these through `HandleWebMessage()` in `WrapperExtension.cpp` and responds via `SendAsyncResponse()`. Messages are identified by string IDs (e.g., "find-leaderboard", "upload-leaderboard-score").

### Key Source Files

- `src/aces.json` - Action/Condition/Expression definitions for C3
- `src/addon.json` - Plugin metadata and file manifest
- `src/lang/en-US.json` - User-facing text strings
- `src/editor.js` - C3 editor integration
- `src/c3runtime/` - Runtime JavaScript (actions, conditions, expressions)
- `wrapper-extension/WrapperExtension.cpp` - Main C++ extension logic
- `wrapper-extension/WrapperExtension.h` - Extension class with Steam callback handlers
- `wrapper-extension/SteamCallbacks.cpp/.h` - Steam event callback management

### Adding New Steam Features

1. Add ACE definitions in `src/aces.json` under appropriate category
2. Add user-facing strings in `src/lang/en-US.json`
3. Add JavaScript action handler in `src/c3runtime/actions.js`
4. Add C++ message handler in `WrapperExtension.cpp`:
   - Add case in `HandleWebMessage()` for new message ID
   - Implement `On<Feature>Message()` method
   - If async, implement callback handler and use `CCallResult`
5. Return data via `SendAsyncResponse()` with JSON for complex data

### Request/Response Pattern

Most actions are async and use a tag system:
- Actions send messages with an `asyncId`
- C++ stores `asyncId` and returns it with the response
- JavaScript triggers `OnRequestResult` or `OnRequestError` conditions
- Results are retrieved via `RequestData(tag)` expression as JSON strings

## Feature Categories

- **Leaderboard**: Find, upload scores, download entries
- **App**: DLC installation checks
- **Friends**: Get persona names, friend lists
- **NetworkingMessages**: P2P messaging, session management

## Output Files

Built addon produces:
- `Steam_plus_x64.ext.dll` (Windows)
- `Steam_plus_x64.ext.so` (Linux)

These go in `src/` and get bundled into the final C3 addon.
