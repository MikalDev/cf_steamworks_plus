#include "pch.h"
#include "WrapperExtension.h"
#include <unordered_map>

#include <sstream>
#include <string>
#include <iostream>
#include <stdexcept>

//////////////////////////////////////////////////////
// Boilerplate stuff
WrapperExtension* g_Extension = nullptr;

// Main DLL export function to initialize extension.
extern "C" {
	__declspec(dllexport) IExtension* WrapperExtInit(IApplication* iApplication)
	{
		g_Extension = new WrapperExtension(iApplication);
		return g_Extension;
	}
}

// Helper method to call HandleWebMessage() with more useful types, as OnWebMessage() must deal with
// plain-old-data types for crossing a DLL boundary.
void WrapperExtension::OnWebMessage(LPCSTR messageId_, size_t paramCount, const ExtensionParameterPOD* paramArr, double asyncId)
{
	HandleWebMessage(messageId_, UnpackExtensionParameterArray(paramCount, paramArr), asyncId);
}

void WrapperExtension::SendWebMessage(const std::string& messageId, const std::map<std::string, ExtensionParameter>& params, double asyncId)
{
	std::vector<NamedExtensionParameterPOD> paramArr = PackNamedExtensionParameters(params);
	iApplication->SendWebMessage(messageId.c_str(), paramArr.size(), paramArr.empty() ? nullptr : paramArr.data(), asyncId);
}

// Helper method for sending a response to an async message (when asyncId is not -1.0).
// In this case the message ID is not used, so this just calls SendWebMessage() with an empty message ID.
void WrapperExtension::SendAsyncResponse(const std::map<std::string, ExtensionParameter>& params, double asyncId)
{
	SendWebMessage("", params, asyncId);
}

//////////////////////////////////////////////////////
// handles to hold reference to across calls
// steam leaderboard handle
static SteamLeaderboard_t g_hSteamLeaderboard = 0;
static double g_SteamLeaderboardAsyncId = 0;
static double g_SteamDownloadLeaderboardEntriesAsyncId = 0;
static SteamLeaderboardEntries_t g_hSteamLeaderboardEntries  = 0;
static int g_SteamLeaderboardEntryCount = 0;

//////////////////////////////////////////////////////
// WrapperExtension
WrapperExtension::WrapperExtension(IApplication* iApplication_)
	: iApplication(iApplication_),
	  hWndMain(NULL),
	  didSteamInitOk(false)
{
	OutputDebugString(L"[SteamExt] Loaded extension\n");

	// Tell the host application the SDK version used. Don't change this.
	iApplication->SetSdkVersion(WRAPPER_EXT_SDK_VERSION);

	// Register the "cf-steam-plus" component for JavaScript messaging
	iApplication->RegisterComponentId("cf-steam-plus");
}

void WrapperExtension::Init()
{
	// Called during startup after all other extensions have been loaded.
}

void WrapperExtension::Release()
{
	OutputDebugString(L"[SteamExt] Releasing extension\n");

	if (didSteamInitOk)
	{
		// Destroy SteamCallbacks class.
		steamCallbacks.reset(nullptr);

		// Shut down Steam API.
		SteamAPI_Shutdown();
	}
}

void WrapperExtension::OnMainWindowCreated(HWND hWnd)
{
	hWndMain = hWnd;
}

// For handling a message sent from JavaScript.
// This method mostly just unpacks parameters and calls a dedicated method to handle the message.
void WrapperExtension::HandleWebMessage(const std::string& messageId, const std::vector<ExtensionParameter>& params, double asyncId)
{
	if (messageId == "run-callbacks")
	{
		SteamAPI_RunCallbacks();
	}
	else if (messageId == "find-leaderboard")
	{
		const std::string& name = params[0].GetString();

		OnFindLeaderboardMessage(name, asyncId);
	} else if (messageId == "upload-leaderboard-score")
	{
;
		int score = static_cast<int>(params[0].GetNumber());

		OnUploadLeaderboardScoreMessage(score, asyncId);
	} else if (messageId == "download-leaderboard-scores")
	{
		int nStart = static_cast<int>(params[0].GetNumber());
		int nEnd = static_cast<int>(params[1].GetNumber());
		const std::string& mode = params[2].GetString();

		OnDownloadLeaderboardEntriesMessage(nStart, nEnd, mode, asyncId);
	} else if (messageId == "is-dlc-installed")
	{
		int appId = static_cast<AppId_t>(params[0].GetNumber());

		OnIsDlcInstalledMessage(appId, asyncId);
	}
	else if (messageId == "get-friend-persona-name")
	{

		CSteamID steamIDFriend = StringToSteamID(params[0].GetString().c_str());
		
		OnGetFriendPersonaNameMessage(steamIDFriend, asyncId);
	}
	else
	{
		OutputDebugString(L"[SteamExt] Unknown message ID\n");
		SendAsyncResponse({
		{ "isOk", false }
		}, asyncId);
	}
}

CSteamID WrapperExtension::StringToSteamID(const std::string& steamIDString) {
    try {
        uint64 steamIDInt = std::stoull(steamIDString);
        return CSteamID(steamIDInt);
    } catch (const std::invalid_argument& ia) {
        // Include the exception message in your error handling
        std::string error_message = "Invalid argument in converting Steam ID string: ";
        error_message += ia.what(); // ia.what() returns the error message associated with the exception
		OutputDebugStringA(error_message.c_str());
		uint64 zeroID = 0;
	    return CSteamID(zeroID);		
    } catch (const std::out_of_range& oor) {
        // Include the exception message in your error handling
        std::string error_message = "Steam ID string is out of range: ";
        error_message += oor.what(); // oor.what() returns the error message associated with the exception
		OutputDebugStringA(error_message.c_str());
		uint64 zeroID = 0;
	    return CSteamID(zeroID);
    }
}

void WrapperExtension::OnFindLeaderboardMessage(const std::string& name, double asyncId)
{
	// Find leaderboard by name and store result in global on callback
	SteamAPICall_t hLeaderboard = SteamUserStats()->FindLeaderboard(name.c_str());
	m_CallbackFindLeaderboard.Set(hLeaderboard, this, &WrapperExtension::OnFindLeaderboard);
	// Store asyncId so it can be used in the callback
	g_SteamLeaderboardAsyncId = asyncId;
}

void WrapperExtension::OnFindLeaderboard(LeaderboardFindResult_t* pCallback, bool bIOFailure)
{
	// Get asyncId from global
	double asyncId = g_SteamLeaderboardAsyncId;

	// Store result in global
	g_hSteamLeaderboard = pCallback->m_hSteamLeaderboard;

	// Send Async Response based on result
	if (pCallback->m_hSteamLeaderboard == 0)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", false }
		}, asyncId);
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
		}, asyncId);
	}
}

void WrapperExtension::OnUploadLeaderboardScoreMessage(int score, double asyncId)
{
	// Upload score to leaderboard for steamworks using the global leaderboard handle
	SteamAPICall_t hSteamAPICall = SteamUserStats()->UploadLeaderboardScore(g_hSteamLeaderboard, k_ELeaderboardUploadScoreMethodForceUpdate, score, NULL, 0);
	// Check for error and result depending on error
	if (hSteamAPICall == 0)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", false }
		}, asyncId);
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
			{ "score", ExtensionParameter(static_cast<float>(score))}
		}, asyncId);
	}
}

void WrapperExtension::OnDownloadLeaderboardEntriesMessage(int nStart, int nEnd, const std::string& mode, double asyncId)
{
	// Find leaderboard by name and store result in global on callback
	ELeaderboardDataRequest requestMode = k_ELeaderboardDataRequestGlobal;
	if (mode == "friends")
	{
		requestMode = k_ELeaderboardDataRequestFriends;
	} else if (mode == "global-around-user")
	{
		requestMode = k_ELeaderboardDataRequestGlobalAroundUser;
	}
	// SteamAPICall_t DownloadLeaderboardEntries( SteamLeaderboard_t hSteamLeaderboard, ELeaderboardDataRequest eLeaderboardDataRequest, int nRangeStart, int nRangeEnd );
	SteamAPICall_t hLeaderboardScoresDownloaded = SteamUserStats()->DownloadLeaderboardEntries(g_hSteamLeaderboard, requestMode, nStart, nEnd);
	// add callback
	m_CallbackDownloadLeaderboardEntries.Set(hLeaderboardScoresDownloaded, this, &WrapperExtension::OnLeaderboardScoresDownloaded);
	// Store asyncId so it can be used in the callback
	g_SteamDownloadLeaderboardEntriesAsyncId = asyncId;

}

void WrapperExtension::OnLeaderboardScoresDownloaded(LeaderboardScoresDownloaded_t* pCallback, bool bIOFailure)
{
	// Get asyncId from global
	double asyncId = g_SteamDownloadLeaderboardEntriesAsyncId;

	SteamLeaderboardEntries_t SteamLeaderboardEntries = pCallback->m_hSteamLeaderboardEntries;
	// Store length in global
	int entryCount = pCallback->m_cEntryCount;
	// Go through entries and store them in an std::unordered_map with key rank-id and global rank score-id and score
	std::string scoresJSON = "[";
	for (int i = 0; i < entryCount; i++)
	{
		LeaderboardEntry_t leaderboardEntry;
		SteamUserStats()->GetDownloadedLeaderboardEntry(SteamLeaderboardEntries, i, &leaderboardEntry, NULL, 0);
		// Get string of userId
		std::string id = std::to_string(leaderboardEntry.m_steamIDUser.ConvertToUint64());
		// Create a string with "rank"+id
		std::string rankId = "rank-" + id;
		// Create a string with "score"+id
		std::string scoreId = "score-" + id;
		// Use rankId to store rank in entries
		// entries.insert(std::make_pair(rankId, ExtensionParameter(float(leaderboardEntry.m_nGlobalRank))));
		// Use scoreId to store score in entries
		// entries.insert(std::make_pair(scoreId, ExtensionParameter(float(leaderboardEntry.m_nScore))));
		std::string rank = std::to_string(leaderboardEntry.m_nGlobalRank);
		std::string score = std::to_string(leaderboardEntry.m_nScore);
		std::string name = std::to_string(leaderboardEntry.m_steamIDUser.ConvertToUint64());
		std::string entry = "{ \"rank\":"+rank+",\"score\":" + score + ",\"steamIDUser\":" + name + " }";
		if (i != entryCount - 1)
		{
			entry += ",";
		}
		scoresJSON += entry;
	}
	scoresJSON += "]";

	// Send Async Response based on result
	if (entryCount == 0)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", false },
		}, asyncId);
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
			{ "scores", scoresJSON },
		} 
			, asyncId);
	}
}

void WrapperExtension::OnIsDlcInstalledMessage( AppId_t appID, double asyncId )
{
	// Check if DLC is installed
	bool isDlcInstalled = SteamApps()->BIsDlcInstalled(appID);
		SendAsyncResponse({
			{ "isOk", true },
			{ "isInstalled", isDlcInstalled },
		}, asyncId);
}

// wrapper extension for the following api const char * GetFriendPersonaName( CSteamID steamIDFriend )
void WrapperExtension::OnGetFriendPersonaNameMessage( CSteamID steamIDFriend, double asyncId )
{
	// Get friend name
	const char* friendPersonaName = SteamFriends()->GetFriendPersonaName(steamIDFriend);
	// check if const char* friendPersonaName is empty or "[unknown]"



	if (friendPersonaName == nullptr || strlen(friendPersonaName) == 0 || strcmp(friendPersonaName, "[unknown]") == 0)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", false },
		}, asyncId);
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
			{ "friendPersonaName", friendPersonaName },
		}, asyncId);
	}
}	

