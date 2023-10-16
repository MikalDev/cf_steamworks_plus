
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

	void SendWebMessage(const std::string& messageId, const std::map<std::string, ExtensionParameter>& params, double asyncId = -1.0);
	void SendAsyncResponse(const std::map<std::string, ExtensionParameter>& params, double asyncId);

	// Handler methods for specific kinds of message
	void OnInitMessage(const std::string& initAppId, bool isDevelopmentMode, double asyncId);
	void OnFindLeaderboardMessage(const std::string& name, double asyncId);
    void OnFindLeaderboard(LeaderboardFindResult_t *pCallback, bool bIOFailure);
    void OnUploadLeaderboardScoreMessage(double score, double asyncId);

    // Steam events (called via SteamCallbacks class)

private:
	    CCallResult<WrapperExtension, LeaderboardFindResult_t> m_CallbackFindLeaderboard;

protected:
	IApplication* iApplication;
	HWND hWndMain;
	bool didSteamInitOk;

	std::unique_ptr<SteamCallbacks> steamCallbacks;
};