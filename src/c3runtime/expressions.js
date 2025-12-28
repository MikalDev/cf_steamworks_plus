const C3 = globalThis.C3;

C3.Plugins.cf_steamworks_plus.Exps =
{
	RequestData(tag)
	{
		// Check if the result map has this tag
		const upCaseTag = tag.toUpperCase();
		if (this._steamResult.has(upCaseTag))
		{
			const result = this._steamResult.get(upCaseTag);
			// If result is an object, stringify it
			if (typeof result === "object")
			{
				return JSON.stringify(result);
			}
			return result;
		}
		else
		{
			console.warn("[Steamworks+] No result for tag", upCaseTag);
			return "";
		}
	},

	RequestError(tag)
	{
		// Check if the error map has this tag
		const upCaseTag = tag.toUpperCase();
		if (this._steamError.has(upCaseTag))
		{
			const result = this._steamError.get(upCaseTag);
			// If result is an object, stringify it
			if (typeof result === "object")
			{
				return JSON.stringify(result);
			}
			return result;
		}
		else
		{
			console.warn("[Steamworks+] No error for tag", upCaseTag);
			return "";
		}
	}
};
