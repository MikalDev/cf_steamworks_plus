#pragma once

class WrapperExtension;

// This class exists purely to receive callbacks from the Steamworks SDK,
// and forward them to WrapperExtension methods.
class SteamCallbacks {
public:
	SteamCallbacks(WrapperExtension& extension_);

protected:
	WrapperExtension& extension;

	STEAM_CALLBACK(SteamCallbacks, OnSessionRequest, SteamNetworkingMessagesSessionRequest_t);
};


