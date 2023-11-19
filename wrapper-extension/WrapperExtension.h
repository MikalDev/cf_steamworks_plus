
#include "IApplication.h"
#include "IExtension.h"

#include "SteamCallbacks.h"

class WrapperExtension : public IExtension {
public:
	WrapperExtension(IApplication* iApplication_);

	// IExtension overrides
	void Init();
	void Release();
	void OnMainWindowCreated(HWND hWnd_);

	// Web messaging methods
	void OnWebMessage(LPCSTR messageId, size_t paramCount, const ExtensionParameterPOD* paramArr, double asyncId);
	void HandleWebMessage(const std::string& messageId, const std::vector<ExtensionParameter>& params, double asyncId);

    CSteamID StringToSteamID(const std::string &steamIDString);

    void SendWebMessage(const std::string& messageId, const std::map<std::string, ExtensionParameter>& params, double asyncId = -1.0);
	void SendAsyncResponse(const std::map<std::string, ExtensionParameter>& params, double asyncId);

	// Handler methods for specific kinds of message
	void OnFindLeaderboardMessage(const std::string& name, double asyncId);
    void OnFindLeaderboard(LeaderboardFindResult_t *pCallback, bool bIOFailure);
	void OnUploadLeaderboardScoreMessage(int score, double asyncId);
	void OnLeaderboardScoresDownloaded(LeaderboardScoresDownloaded_t *pCallback, bool bIOFailure);
    void OnIsDlcInstalledMessage(AppId_t appID, double asyncId);
    void OnGetFriendPersonaNameMessage(CSteamID steamIDFriend, double asyncId);
    void OnSendMessageToUserMessage(CSteamID steamID, const std::string &message, double asyncId);
    void OnReceiveMessagesMessage(int nLocalChannel, double asyncId);
    void OnDownloadLeaderboardEntriesMessage(int nStart, int nEnd, const std::string &, double asyncId);

    // Steam events (called via SteamCallbacks class)

private:
	    CCallResult<WrapperExtension, LeaderboardFindResult_t> m_CallbackFindLeaderboard;
		// DownloadLeaderboard CCallResult
		CCallResult<WrapperExtension, LeaderboardScoresDownloaded_t> m_CallbackDownloadLeaderboardEntries;


protected:
	IApplication* iApplication;
	HWND hWndMain;
	bool didSteamInitOk;

	std::unique_ptr<SteamCallbacks> steamCallbacks;
};