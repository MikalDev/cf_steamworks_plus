function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this.SetWrapperExtensionComponentId("cf-steam-plus");

      // For running callbacks while loading
      this._loadingTimerId = -1

      // For trigger results
      this._steamResult = new Map()

        if (properties) {
        }

            // Corresponding wrapper extension is available
      if (this.IsWrapperExtensionAvailable()) console.log("Steamworks+ IsWrapperExtensionAvailable");
      // this.SendWrapperExtensionMessage("init");
      // this._loadingTimerId = self.setInterval(() => this._RunCallbacks(), 20);
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
      console.log('run-callbacks result', result)
    }

    async _FindLeaderboard(leaderboardName)
    {
      console.log('find-leaderboard', leaderboardName)
      const result = await this.SendWrapperExtensionMessageAsync("find-leaderboard", [leaderboardName]);
  
      this._triggerLeaderboardName = leaderboardName;
  
      console.log('find-leaderboard result', result)
      const isOk = result["isOk"];
      if (isOk)
      {
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAnyAchievementUnlockSuccess);
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAchievementUnlockSuccess);
        console.log("isOK")
      }
      else
      {
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAnyAchievementUnlockError);
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAchievementUnlockError);
        console.log("!isOK")
      }
  
      // Return result for script interface
      return isOk;
    }

    async _UploadLeaderboardScore(score) {
      console.log('update-leaderboard-score', score)
      const result = await this.SendWrapperExtensionMessageAsync("upload-leaderboard-score", [score]);
      // Check result and respond
      const isOk = result["isOk"];
      if (isOk)
      {
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAnyAchievementUnlockSuccess);
        console.log("isOK")
      }
      else
      {
        // this.Trigger(C3.Plugins.Steamworks_Ext.Cnds.OnAnyAchievementUnlockError);
        console.log("!isOK")
      }
    }

    LoadFromJson(o) {
      // load state for savegames
    }

    Trigger(method) {
      super.Trigger(method);
      const addonTrigger = addonTriggers.find((x) => x.method === method);
      if (addonTrigger) {
        this.GetScriptInterface().dispatchEvent(new C3.Event(addonTrigger.id));
      }
    }

    GetScriptInterfaceClass() {
      return scriptInterface;
    }
  };
}
