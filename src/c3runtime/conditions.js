const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Cnds =
{
	OnRequestResult(tag)
	{
		// Check for match between tag and trigger tag, case-insensitive
		const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
		return match;
	},

	OnRequestError(tag)
	{
		// Check for match between tag and trigger tag, case-insensitive
		const match = this._triggerTag.toUpperCase() === tag.toUpperCase();
		return match;
	},

	OnSessionRequest()
	{
		return true;
	}
};
