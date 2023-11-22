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
// map that contains key of uint64 and value of identityRemote
static std::unordered_map<uint64, SteamNetworkingIdentity> g_SteamNetworkingIdentities;

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
	steamCallbacks.reset(new SteamCallbacks(*this));
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
	} else if (messageId == "send-message-to-user")
	{
		CSteamID steamID = StringToSteamID(params[0].GetString().c_str());
		const std::string& message = params[1].GetString();
		OnSendMessageToUserMessage(steamID, message, asyncId);
	} else if (messageId == "receive-messages")
	{
		int nLocalChannel = static_cast<int>(params[0].GetNumber());
		OnReceiveMessagesMessage(nLocalChannel, asyncId);
	} else if (messageId == "accept-session-from-user")
	{
		CSteamID steamIDRemote = StringToSteamID(params[0].GetString().c_str());
		OnAcceptSessionWithUserMessage(steamIDRemote, asyncId);
	} else if (messageId == "enable-networking")
	{
		bool enable = params[0].GetBool();
		if (enable && !m_bNetworkingMessagesEnabled)
		{
			steamCallbacks.reset(new SteamCallbacks(*this));
			m_bNetworkingMessagesEnabled = true;
		}
	}
	else if (messageId == "get-friends-name-id") {
		OnGetFriendsNameIdMessage(asyncId);
	} else
	{
		OutputDebugString(L"[SteamExt] Unknown message ID\n");
		SendAsyncResponse({
		{ "isOk", false },
		{ "error", "Unknown message ID" },
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

// CSteamID to string
std::string WrapperExtension::SteamIDToString(CSteamID steamID) {
	std::stringstream ss;
	ss << steamID.ConvertToUint64();
	return ss.str();
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
	SteamAPICall_t hSteamAPICall = SteamUserStats()->UploadLeaderboardScore(g_hSteamLeaderboard, k_ELeaderboardUploadScoreMethodKeepBest, score, NULL, 0);
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

	// Get CSTeamID from friendPersonaName
	CSteamID steamIDFriendPN = SteamFriends()->GetFriendByIndex(1, k_EFriendFlagImmediate);
	// steamIDFriendPN to string
	std::string steamIDFriendPNString = SteamIDToString(steamIDFriendPN);
	// cocatenate steamIDFriendPNString with friendPersonaName

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

// wrapper extension for EResult SendMessageToUser( const SteamNetworkingIdentity &identityRemote, const void *pubData, uint32 cubData, int nSendFlags, int nRemoteChannel );
void WrapperExtension::OnSendMessageToUserMessage( CSteamID steamID, const std::string& message, double asyncId )
{
	// Set SteamNetworkingIdentity
	SteamNetworkingIdentity identityRemote;
	identityRemote.SetSteamID(steamID);
	// Send message to user
	// Get message length cast as uint32
	uint32 messageLength = static_cast<uint32>(message.length());
	const char* messageP = message.c_str();
	std::string debugMessage = "Send Message: ";
    debugMessage += SteamIDToString(steamID)+":";
    debugMessage += message;
	debugMessage += "\n";
	// OutputDebugStringA(debugMessage.c_str());
	// create nOptions variable with these enums k_nSteamNetworkingSend_AutoRestartBrokenSession and k_nSteamNetworkingSend_Reliable
	int nSendFlags = k_nSteamNetworkingSend_AutoRestartBrokenSession | k_nSteamNetworkingSend_Reliable;
	EResult result = SteamNetworkingMessages()->SendMessageToUser(identityRemote, messageP, messageLength, nSendFlags, 0);
	if (result != k_EResultOK)
	{
		// Error
		// Create string from result
		std::string error = std::to_string(result);
		SendAsyncResponse({
			{ "isOk", false},
			{ "error", error},
		}, asyncId);
		OutputDebugStringA(error.c_str());
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
		}, asyncId);
		std::string error = std::to_string(result);
		// OutputDebugStringA(error.c_str());
	}
}

// wrapper extension for int ReceiveMessagesOnChannel( int nLocalChannel, SteamNetworkingMessage_t **ppOutMessages, int nMaxMessages )
// put all messages in a string array and send them back to the extension via sendAsyncResponse
void WrapperExtension::OnReceiveMessagesMessage( int nLocalChannel, double asyncId )
{
	int nMaxMessages = 100;
	// Receive messages on channel
	// Allocate memory for pOutMessages
	SteamNetworkingMessage_t* pOutMessages[100];
	// SteamNetworkingMessage_t** pOutMessages = new SteamNetworkingMessage_t*[nMaxMessages];

	int nMessages = SteamNetworkingMessages()->ReceiveMessagesOnChannel(nLocalChannel, pOutMessages, nMaxMessages);
	// convert nMessages to string
	std::string nMessagesString = std::to_string(nMessages);
	// std::string debugMessage = "Rcv Message: ";
    // debugMessage += nMessagesString;
	// OutputDebugStringA(debugMessage.c_str());
	// Check if messages were received
	if (nMessages == 0)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", true },
			{ "messages", "[]" },
			{ "nMessages", nMessagesString },
		}, asyncId);
	}
	else
	{
		// OutputDebugString(L"[SteamExt] Received messages\n");
		// Go through messages and store them in the string array
		std::string messagesJSONString = "{";
		for (int i = 0; i < nMessages; i++)
		{
			// OutputDebugString(L"[SteamExt] processing message\n");
			std::string iS = std::to_string(i); 
			// Get message
			SteamNetworkingMessage_t* message = pOutMessages[i];
			// Get message data
			const char* messageData = (const char*)message->m_pData;
			// Get message data length
			int messageDataLength = message->m_cbSize;
			// Create string using message data and message data length
			std::string messageString = std::string(messageData, messageDataLength);
			// Create string from message identityPeer
			std::string messageIdentityPeerString = std::to_string(message->m_identityPeer.m_steamID64);
			std::string timeReceivedString = std::to_string(message->m_usecTimeReceived);
			// Create string for channel
			std::string nChannelString = std::to_string(message->m_nChannel);
			// store messageString and messageIdentityPeer in json object within an array
			// OutputDebugString(L"[SteamExt] Add to JSON\n");
			// add message and identitPeer to messageJSONString object with key iS
			messagesJSONString += "\"" + iS + "\":{\"message\":\"" + messageString + "\",\"identityPeer\":\"" + messageIdentityPeerString + "\",\"timeReceived\":\"" + timeReceivedString + "\",\"nChannel\":\"" + nChannelString + "\"}";
			// if not last entry add comma, else add closing bracket
			if (i != nMessages - 1)
			{
				messagesJSONString += ",";
			}
			else
			{
				messagesJSONString += "}";
			}
			// OutputDebugString(L"[SteamExt] Added to JSON\n");
			message->Release();
		}
		// convert json object to string
		// OutputDebugString(L"[SteamExt] JSON string output\n");
		// OutputDebugStringA(messagesJSONString.c_str());
		// Send messages back to extension
		SendAsyncResponse({
			{ "isOk", true },
			{ "messages", messagesJSONString },
			{ "nMessages", nMessagesString },
		}, asyncId);
	}
}

void WrapperExtension::OnGetFriendsNameIdMessage(double asyncId)
{
	// Get friend count
	int friendCount = SteamFriends()->GetFriendCount(k_EFriendFlagImmediate);
	// Go through friends and store them in the string array
	std::string friendsJSONString = "[";
	for (int i = 0; i < friendCount; i++)
	{
		// Get friend
		CSteamID friendSteamID = SteamFriends()->GetFriendByIndex(i, k_EFriendFlagImmediate);
		// Get friend name
		const char* friendPersonaName = SteamFriends()->GetFriendPersonaName(friendSteamID);
		// Get std::string of friendPersonaName
		std::string friendPersonaNameString = std::string(friendPersonaName);
		// Get string of userId
		std::string id = std::to_string(friendSteamID.ConvertToUint64());
		std::string entry = "{ \"personaName\":\""+friendPersonaNameString+"\",\"steamId\":\"" + id +"\" }";
		if (i != friendCount - 1)
		{
			entry += ",";
		}
		friendsJSONString += entry;
	}
	friendsJSONString += "]";
	// Send Async Response based on result
	// Success
	SendAsyncResponse({
		{ "isOk", true },
		{ "friends", friendsJSONString },
	}, asyncId);
}

// callback for OnSessionRequest
void WrapperExtension::OnSessionRequest(SteamNetworkingMessagesSessionRequest_t* pCallback)
{
	OutputDebugString(L"[SteamExt] OnSessionRequest\n");
	// Get session id
	uint64 remoteSteamId = pCallback->m_identityRemote.m_steamID64;
	// copy contents of pCallback->m_identityRemote to g_SteamNetworkingIdentities with key remoteSteamId
	g_SteamNetworkingIdentities[remoteSteamId] = pCallback->m_identityRemote;
	// Get session id as string
	std::string remoteSteamIdString = std::to_string(remoteSteamId);
	// Send Async Response based on result
	if (remoteSteamId == 0)
	{
		// Error
		SendWebMessage("session-request",{
			{ "isOk", false },
		});
	}
	else
	{
		// Success
		SendWebMessage("session-request",{
			{ "isOk", true },
			{ "remoteSteamId", remoteSteamIdString },
		});
	}
}

// Create OnAcceptSessionWithUserMessage
// Parameters CSteamID steamIDRemote
void WrapperExtension::OnAcceptSessionWithUserMessage(CSteamID steamIdRemote, double asyncId)
{
	OutputDebugString(L"[SteamExt] OnAcceptSession\n");

	// Accept session with user
	// SteamAPICall_t AcceptSessionWithUser( CSteamID steamIDRemote );
	// get uint64 from steamIdRemote
	uint64 steamIdRemoteUint64 = steamIdRemote.ConvertToUint64();
	// get SteamNetworkingIdentity from g_SteamNetworkingIdentities with key steamIdRemoteUint64
	SteamNetworkingIdentity identityRemote = g_SteamNetworkingIdentities[steamIdRemoteUint64];
	bool result = SteamNetworkingMessages()->AcceptSessionWithUser(identityRemote);
	// Check for error and result depending on error
	if (!result)
	{
		// Error
		SendAsyncResponse({
			{ "isOk", false }
		}, asyncId);
		OutputDebugString(L"[SteamExt] OnAcceptSession Fail\n");
	}
	else
	{
		// Success
		SendAsyncResponse({
			{ "isOk", true },
		}, asyncId);
		OutputDebugString(L"[SteamExt] OnAcceptSession Pass\n");
	}
}

