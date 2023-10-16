
#include "pch.h"

#include "SteamCallbacks.h"
#include "WrapperExtension.h"

// This class exists purely to receive callbacks from the Steamworks SDK,
// and forward them to WrapperExtension methods.
SteamCallbacks::SteamCallbacks(WrapperExtension& extension_)
	: extension(extension_)
{
}
/*
	void SteamCallbacks::OnFindLeaderboard(LeaderboardFindResult_t* pCallback)
{
	extension.OnFindLeaderboard(pCallback);
}
*/