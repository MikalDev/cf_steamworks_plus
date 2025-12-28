const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Acts =
{
	async FindLeaderboard(leaderboardName)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.SetLeaderboard;
		const result = await this._sendWrapperExtensionMessageAsync("find-leaderboard", [leaderboardName]);

		this._triggerLeaderboardName = leaderboardName;

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), { leaderboardName, result: 1 });
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), { leaderboardName, result: 0 });
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}

		// Return result for script interface
		return isOk;
	},

	async UpdloadLeaderboardScore(score)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.UploadLeaderboardScore;
		const result = await this._sendWrapperExtensionMessageAsync("upload-leaderboard-score", [score]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), { score, result: 1 });
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), { score, result: 0 });
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	async DownloadLeaderboardScores(nStart, nEnd, mode)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.DownloadLeaderboardScores;
		const requestMode = mode === 0 ? "global" : mode === 1 ? "global-around-user" : "friends";

		const result = await this._sendWrapperExtensionMessageAsync("download-leaderboard-scores", [nStart, nEnd, requestMode]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), result["scores"]);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), `error:${tag}: check if user has score, or if leaderboard exists`);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	async IsDlcInstalled(appId)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.IsDlcInstalled;
		const result = await this._sendWrapperExtensionMessageAsync("is-dlc-installed", [appId]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), result["isInstalled"] ? 1 : 0);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), `error:${tag}:`);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	async GetFriendPersonaName(steamId)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.GetFriendPersonaName;
		const result = await this._sendWrapperExtensionMessageAsync("get-friend-persona-name", [steamId]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), result["friendPersonaName"]);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), `error:${tag}: no name found`);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	async SendMessageToUser(identityRemote, message)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.SendMessageToUser;
		const result = await this._sendWrapperExtensionMessageAsync("send-message-to-user", [identityRemote, message]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), "");
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), result["error"]);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	EnableNetworking(enable)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		this._enableNetworking = enable;
		this._sendWrapperExtensionMessageAsync("enable-networking", [enable]);
	},

	async AcceptSessionWithUser(remoteSteamId)
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.AcceptSessionWithUser;
		const result = await this._sendWrapperExtensionMessageAsync("accept-session-from-user", [remoteSteamId]);

		const isOk = result["isOk"];
		if (isOk)
		{
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), "error");
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	},

	async GetFriendsNameId()
	{
		// Ignore action if extension unavailable
		if (!this._isAvailable())
			return;

		const tag = this._Tag.GetFriendsNameId;
		const result = await this._sendWrapperExtensionMessageAsync("get-friends-name-id");

		const isOk = result["isOk"];
		if (isOk)
		{
			this._steamResult.set(tag.toUpperCase(), result["friends"]);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
		}
		else
		{
			this._steamError.set(tag.toUpperCase(), `error:${tag}: no name found`);
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
		}
	}
};
