#include "pch.h"
#include "WrapperExtension.h"

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
static SteamLeaderboard_t g_SteamLeaderboardHandle = 0;
static double g_SteamLeaderboardasyncId = 0;

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
	if (messageId == "init")
	{
		const std::string& initAppId = params[0].GetString();
		bool isDevelopmentMode = params[1].GetBool();
		OnInitMessage(initAppId, isDevelopmentMode, asyncId);
	}
	else if (messageId == "run-callbacks")
	{
		SteamAPI_RunCallbacks();
	}
	else if (messageId == "find-leaderboard")
	{
		const std::string& name = params[0].GetString();

		OnFindLeaderboardMessage(name, asyncId);
	} else if (messageId == "upload-leaderboard-score")
	{
		const std::string& name = params[0].GetString();
		double score = params[0].GetNumber();

		OnUploadLeaderboardScoreMessage(score, asyncId);
	}
	else
	{
		OutputDebugString(L"[SteamExt] Unknown message ID\n");
	}
}

void WrapperExtension::OnInitMessage(const std::string& initAppId, bool isDevelopmentMode, double asyncId)
{
	// Before calling SteamAPI_Init(), check if the plugin has an app ID set.
	// Create SteamCallbacks class.
	// Note the Steamworks SDK documentation states that Steam should be initialized before creating
	// objects that listen for callbacks, which SteamCallbacks does, hence it being a separate class.
	steamCallbacks.reset(new SteamCallbacks(*this));
}

void WrapperExtension::OnFindLeaderboardMessage(const std::string& name, double asyncId)
{
	// Find leaderboard by name and store result in global on callback
	SteamAPICall_t leaderboardHandle = SteamUserStats()->FindLeaderboard(name.c_str());
	m_CallbackFindLeaderboard.Set(leaderboardHandle, this, &WrapperExtension::OnFindLeaderboard);
	// Store asyncId so it can be used in the callback
	g_SteamLeaderboardasyncId = asyncId;
}

void WrapperExtension::OnFindLeaderboard(LeaderboardFindResult_t* pCallback, bool bIOFailure)
{
	// Get asyncId from global
	double asyncId = g_SteamLeaderboardasyncId;

	// Store result in global
	g_SteamLeaderboardHandle = pCallback->m_hSteamLeaderboard;

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
			{ "isOk", true }
		}, asyncId);
	}
}

void WrapperExtension::OnUploadLeaderboardScoreMessage(double score, double asyncId)
{
	// Upload score to leaderboard for steamworks using the global leaderboard handle
	SteamAPICall_t hSteamAPICall = SteamUserStats()->UploadLeaderboardScore(g_SteamLeaderboardHandle, k_ELeaderboardUploadScoreMethodKeepBest, score, NULL, 0);
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
			{ "isOk", true }
		}, asyncId);
	}
}

