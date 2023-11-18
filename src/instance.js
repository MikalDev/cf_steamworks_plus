function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this._Tag = {
        DownloadLeaderboardScores: "DownloadLeaderboardScores",
        IsDlcInstalled: "IsDlcInstalled",
        SetLeaderboard: "SetLeaderboard",
        UploadLeaderboardScore: "UploadLeaderboardScore",
        GetFriendPersonaName: "GetFriendPersonaName",
      }

      this.SetWrapperExtensionComponentId("cf-steam-plus");

      // For trigger results
      this._steamResult = new Map()
      this._steamError = new Map()

      // trigger tag
      this._triggerTag = ""

        if (properties) {
        }

      // Corresponding wrapper extension is available
      if (this.IsWrapperExtensionAvailable()) console.log("Steamworks+ IsWrapperExtensionAvailable");
      this._StartTicking();
    }

    Release() {
      super.Release();
    }

    SaveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    Tick() {
      // On the first tick, clear the timer running callbacks for the loading screen.
      /*
      if (this._loadingTimerId !== -1)
      {
        self.clearInterval(this._loadingTimerId);
        this._loadingTimerId = -1;
      }
      */
      
    }

    async _RunCallbacks()
    {
      // Tell extension to call SteamAPI_RunCallbacks().
      const result = await this.SendWrapperExtensionMessageAsync("run-callbacks");
    }

    async _SetLeaderboard(leaderboardName)
    {
      const tag = this._Tag.SetLeaderboard;
      const result = await this.SendWrapperExtensionMessageAsync("find-leaderboard", [leaderboardName]);
  
      this._triggerLeaderboardName = leaderboardName;
  
      const isOk = result["isOk"];
      if (isOk)
      {
        this._steamResult.set(tag.toUpperCase(), { leaderboardName, result: 1 })
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
      }
      else
      {
        this._steamError.set(tag.toUpperCase(), { leaderboardName, result: 0 })
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
      }
  
      // Return result for script interface
      return isOk;
    }

    async _UploadLeaderboardScore(score) {
      tag = this._Tag.UploadLeaderboardScore;
      const result = await this.SendWrapperExtensionMessageAsync("upload-leaderboard-score", [score]);
      // Check result and respond
      const isOk = result["isOk"];
      if (isOk)
      {
        this._steamResult.set(tag.toUpperCase(), { score, result: 1 })
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
      }
      else
      {
        this._steamError.set(tag.toUpperCase(), { score, result: 0 })
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
      }
    }

    _RequestData(tag) {
      // Check if the result map has this tag
      const upCaseTag = tag.toUpperCase();
      if (this._steamResult.has(upCaseTag)) {
        return this._steamResult.get(upCaseTag);
      } else {
        console.warn("[Steamworks+] No result for tag", upCaseTag);
        return "";
      }
    }

    _RequestError(tag) {
      // Check if the result map has this tag
      const upCaseTag = tag.toUpperCase();
      if (this._steamError.has(upCaseTag)) {
        return this._steamError.get(upCaseTag);
      } else {
        console.warn("[Steamworks+] No error for tag", upCaseTag);
        return "";
      }
    }

    async _DownloadLeaderboardScores(nStart, nEnd, mode) {
      const tag = this._Tag.DownloadLeaderboardScores;
      const requestMode = mode === 0 ? "global" : mode === 1 ? "global-around-user" : "friends";

      const result = await this.SendWrapperExtensionMessageAsync("download-leaderboard-scores", [nStart, nEnd, requestMode]);
      // Check result and respond
      const isOk = result["isOk"];
      if (isOk)
      {
        this._steamResult.set(tag.toUpperCase(), result["scores"])
        this._triggerTag = tag.toUpperCase();
        // Call trigger
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
      }
      else
      {
        this._steamError.set(tag.toUpperCase(), `error:${tag}: check if user has score, or if leaderboard exists`)
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
      }
    }

    async _IsDlcInstalled(appId) {
      const tag = this._Tag.IsDlcInstalled;
      const result = await this.SendWrapperExtensionMessageAsync("is-dlc-installed", [appId]);
      // Check result and respond
      const isOk = result["isOk"];
      if (isOk)
      {
        this._steamResult.set(tag.toUpperCase(), result["isInstalled"] ? 1 : 0)
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
      } else {
        this._steamError.set(tag.toUpperCase(), `error:${tag}:`)
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
      }
    }

    _OnRequestResult(tag) {
      // Check for match between tag and trigger tag, change both to upper case before comparing
      const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
      return match;
    }

    _OnRequestError(tag) {
      // Check for match between tag and trigger tag, change both to upper case before comparing
      const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
      return match;
    }

    async _GetFriendPersonaName(steamId) {
      const tag = this._Tag.GetFriendPersonaName;
      const result = await this.SendWrapperExtensionMessageAsync("get-friend-persona-name", [steamId]);
      // Check result and respond
      const isOk = result["isOk"];
      if (isOk)
      {
        this._steamResult.set(tag.toUpperCase(), result["friendPersonaName"])
        this._triggerTag = tag.toUpperCase();
        // Call trigger
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
      }
      else
      {
        this._steamError.set(tag.toUpperCase(), `error:${tag}: no name found`)
        this._triggerTag = tag.toUpperCase();
        this.Trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
      }
    }

    LoadFromJson(o) {
      // load state for savegames
    }
/*
    Trigger(method) {
      super.Trigger(method);
      console.log("addonTriggers", addonTriggers)
      const addonTrigger = addonTriggers.find((x) => x.method === method);
      if (addonTrigger) {
        this.GetScriptInterface().dispatchEvent(new C3.Event(addonTrigger.id));
      }
    }
  */

    GetScriptInterfaceClass() {
      return scriptInterface;
    }
  };
}
