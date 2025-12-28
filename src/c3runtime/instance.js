const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Instance = class cf_steamworks_plusInstance extends globalThis.ISDKInstanceBase
{
	constructor()
	{
		// Set the component ID for JavaScript messaging. This must match the ID
		// specified with RegisterComponentId() in the wrapper extension.
		super({ wrapperComponentId: "cf-steam-plus" });

		// Check if the wrapper extension is available
		this._isWrapperExtAvailable = this._isWrapperExtensionAvailable();

		// Tag constants for identifying request types
		this._Tag = {
			DownloadLeaderboardScores: "DownloadLeaderboardScores",
			IsDlcInstalled: "IsDlcInstalled",
			SetLeaderboard: "SetLeaderboard",
			UploadLeaderboardScore: "UploadLeaderboardScore",
			GetFriendPersonaName: "GetFriendPersonaName",
			SendMessageToUser: "SendMessageToUser",
			OnNetworkingMessage: "OnNetworkingMessage",
			OnSessionRequest: "OnSessionRequest",
			AcceptSessionWithUser: "AcceptSessionWithUser",
			GetFriendsNameId: "GetFriendsNameId",
		};

		// For trigger results
		this._steamResult = new Map();
		this._steamError = new Map();
		this._enableNetworking = false;

		// Trigger tag for identifying which request triggered
		this._triggerTag = "";

		// Leaderboard name for tracking
		this._triggerLeaderboardName = "";

		const properties = this._getInitProperties();
		if (properties)
		{
			// Read properties if needed
		}

		if (this._isWrapperExtAvailable)
		{
			console.log("Steamworks+ wrapper extension available");
			this._startTicking();
			// Listen for session request events from the extension
			this._addWrapperExtensionMessageHandler("session-request", e => this._OnSessionRequestMessage(e));
		}
	}

	_release()
	{
		super._release();
	}

	// Called every tick when ticking is enabled
	async _tick()
	{
		if (this._enableNetworking)
		{
			// Poll for networking messages
			const tag = this._Tag.OnNetworkingMessage;
			const result = await this._sendWrapperExtensionMessageAsync("receive-messages", [0]);
			const isOk = result["isOk"];

			if (isOk)
			{
				const nMessages = parseInt(result["nMessages"]);
				if (nMessages > 0)
				{
					const messages = JSON.parse(result["messages"]);
					console.log("messages", messages);
					// Iterate through the messages which are stored as objects with index keys
					for (let i = 0; i < nMessages; i++)
					{
						const message = messages[i.toString()];
						// Set the result for the tag
						this._steamResult.set(tag.toUpperCase(), JSON.stringify(message));
						this._triggerTag = tag.toUpperCase();
						this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestResult);
					}
				}
			}
			else
			{
				console.log("poll-networking error", result);
				this._steamResult.set(tag.toUpperCase(), "error:poll-networking");
				this._triggerTag = tag.toUpperCase();
				this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
			}
		}
	}

	// Internal helper to check availability
	_isAvailable()
	{
		return this._isWrapperExtAvailable;
	}

	_saveToJson()
	{
		return {
			// data to be saved for savegames
		};
	}

	_loadFromJson(o)
	{
		// load state for savegames
	}

	// Session request message handler (called from wrapper extension)
	_OnSessionRequestMessage(e)
	{
		const tag = this._Tag.OnSessionRequest;
		const isOk = e["isOk"];

		if (!isOk)
		{
			this._steamError.set(tag.toUpperCase(), "error");
			this._triggerTag = tag.toUpperCase();
			this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnRequestError);
			console.log("session request error", e);
			return;
		}

		console.log("session request", e);
		this._steamResult.set(tag.toUpperCase(), JSON.stringify(e));
		this._triggerTag = tag.toUpperCase();
		this._trigger(C3.Plugins.cf_steamworks_plus.Cnds.OnSessionRequest);
	}
};
