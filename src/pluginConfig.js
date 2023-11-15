// WARNING: DO NOT EDIT THIS FILE, IT IS AUTOGENERATED
module.exports = {
  addonType: "plugin",
  id: "cf_steamworks_plus",
  name: "Steamworks Plus",
  version: "1.5.0",
  category: "platform-specific",
  author: "cf",
  website: "https://www.construct.net",
  documentation: "https://www.construct.net",
  description: "Steamworks companion addon",
  // addonUrl: "https://www.construct.net/en/make-games/addons/####/XXXX", // displayed in auto-generated docs
  // githubUrl: "https://github.com/skymen/XXXX", // displays latest release version in auto-generated docs
  // icon: "icon.svg", // defaults to "icon.svg" if omitted
  type: "object",   // world, object, dom
  domSideScripts: [
    // "domSide.js", // no need to include "c3runtime/" prefix
  ],
  fileDependencies: [
    /*
    {
      filename: "filename.js", // no need to include "c3runtime/" prefix
      type:
        "copy-to-output"
        "inline-script"
        "external-dom-script"
        "external-runtime-script"
        "external-css"

      // for copy-to-output only
      // fileType: "image/png"
    }
    */
    {
      filename: "Steam_plus_x64.ext.dll", // no need to include "c3runtime/" prefix
      type: "wrapper-extension",
			platform: "windows-x64"
    },
  ],
  info: {
    // world only
    defaultImageUrl: null,
    Set: {
      // object only
      IsSingleGlobal: true,

      // world and object
      CanBeBundled: true,
      IsDeprecated: false,
      GooglePlayServicesEnabled: false,
    },
  },
  properties: [
    /*
    {
      type:
        "integer"
        "float"
        "percent"
        "text"
        "longtext"
        "check"
        "font"
        "combo"
        "color"
        "object"
        "group"
        "link"
        "info"

      id: "property_id",
      options: {
        initialValue: 0,
        interpolatable: false,

        // minValue: 0, // omit to disable
        // maxValue: 100, // omit to disable

        // for type combo only
        // items: [
        //   {itemId1: "item name1" },
        //   {itemId2: "item name2" },
        // ],

        // dragSpeedMultiplier: 1, // omit to disable

        // for type object only
        // allowedPluginIds: ["Sprite", "<world>"],

        // for type link only
        // linkCallback: `function(instOrObj) {}`,
        // linkText: "Link Text",
        // callbackType:
        //   "for-each-instance"
        //   "once-for-type"

        // for type info only
        // infoCallback: `function(inst) {}`,
      },
      name: "Property Name",
      desc: "Property Description",
    }
    */
  ],
  aceCategories: {
    // follows the format id: langName
    // in the ACEs refer to categories using the id, not the name
    leaderboard: "Leaderboard",
    general: "General",
    app: "App",
  },
  Acts: {
    /*
    SampleAction: {
      // The category of the action as it appears in the add action dialog
      category: "general",

      // Forward to the instance function name
      forward: "_SampleAction",
      // Or specify a handler function
      handler: `function () {
        // Your code here
      }`,

      // Set to true to automatically generate a script interface for this action
      // Cases where you might not want this are:
      // 1- If the action params are incompatible with the script interface
      // 2- If you don't want it to appear in the script interface
      // 3- If the script interface has a better way to achieve the same thing
      autoScriptInterface: true,

      // Set to true to highlight the action in the add action dialog
      highlight: true,

      // Set to true to hide the action in the interface. False by default if not specified.
      deprecated: false,

      // Marks the action as async. Defaults to false if not specified.
      isAsync: false,

      // list of parameters
      params: [
        {
          // The id of the parameter. This is used to generate the script interface.
          // It must be unique for each parameter.
          id: "param1",
          // The name of the parameter.
          name: "Param 1",
          // The description of the parameter.
          desc: "The first parameter",

          // The type of the parameter.
          type:
            // The following types can take a default value AND be automatically generated in the script interface
            - "string"
            - "number"
            - "any"
            - "boolean"

            // The following types can take a default value but CANNOT be automatically generated in the script interface
            - "combo"

            // The following types CANNOT take a default value AND CANNOT be automatically generated in the script interface
            - "cmp"
            - "object"
            - "objectname"
            - "layer"
            - "layout"
            - "keyb"
            - "instancevar"
            - "instancevarbool"
            - "eventvar"
            - "eventvarbool"
            - "animation"
            - "objinstancevar"

          // The default value of the parameter. Can be omitted if the type is not a string, number, any, boolean or combo.
          value: "the default value of the parameter",

          // Only for type "combo"
          items: [
            {"itemId1": "itemName1"},
            {"itemId2": "itemName2"},
            {"itemId3": "itemName3"},
          ],

          // Only for type "object"
          allowedPluginIds: ["Sprite", "TiledBg"],
        },
      ],

      // The name of the action as it appears in the add action dialog
      listName: "Sample Action",

      // The text that appears in the event sheet. Note, every single param must be used in the display text.
      // You can also use [b] and [i] tags.
      displayText: "Sample action [i]{0}[/i]",

      // The description of the action as it appears in the add action dialog
      description: "This is a sample action",
    },
    */
    FindLeaderboard: {
      // The category of the action as it appears in the add action dialog
      category: "leaderboard",
      forward: "_SetLeaderboard",
      autoScriptInterface: true,
      highlight: true,
      deprecated: false,
      isAsync: true,

      // list of parameters
      params: [
        {
          id: "name",
          name: "Name",
          desc: "Name of the leaderboard.",
          type: "string",
          value: "",
        },
      ],
      listName: "Set leaderboard",
      displayText: "Set leaderboard [i]{0}[/i]",
      description: "Set leaderboard and set as current leaderboard.",
    },
    // Update leaderboard score
    // Params: leaderboardName, score
    UpdloadLeaderboardScore: {
      category: "leaderboard",
      forward: "_UploadLeaderboardScore",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      isAsync: true,

      params: [
        {
          id: "score",
          name: "Score",
          desc: "Score to upload.",
          type: "number",
          value: 0,
        },
      ],
      listName: "Upload current leaderboard score",
      displayText: "Upload current leaderboard score to [i]{0}[/i]",
      description: "Upload current leaderboard score.",
    },
    // Download leaderboard scores
    // Params: leaderboardName, start, end
    DownloadLeaderboardScores: {
      category: "leaderboard",
      forward: "_DownloadLeaderboardScores",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      isAsync: true,

      params: [
        {
          id: "start",
          name: "Start",
          desc: "Start position.",
          type: "number",
          value: 0,
        },
        {
          id: "end",
          name: "End",
          desc: "End position.",
          type: "number",
          value: 0,
        },
        {
          id: "mode",
          name: "Mode",
          desc: "Mode.",
          type: "combo",
          value: "global",
          items: [
            { "global": "Global" },
            { "global-around-user": "GlobalAroundUser" },
            { "friends": "Friends" },
          ],
        }
      ],
      listName: "Download leaderboard scores",
      displayText: "Download leaderboard scores from [i]{0}[/i] to [i]{1}[/i], mode [i]{2}[/i]",
      description: "Download leaderboard scores.",
    },
    // Is Dlc installed
    // Params AppId
    IsDlcInstalled: {
      category: "app",
      forward: "_IsDlcInstalled",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      isAsync: true,
      params: [
        {
          id: "appId",
          name: "AppId",
          desc: "AppId of the DLC.",
          type: "number",
          value: 0,
        },
      ],
      listName: "Is DLC installed",
      displayText: "Is DLC [i]{0}[/i] installed",
      description: "Is DLC installed.",
    },
  },
  Cnds: {
    OnRequestResult: {
      // The category of the action as it appears in the add condition dialog
      category: "general",
      forward: "_OnRequestResult",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      isTrigger: true,
      isFakeTrigger: false,
      isStatic: false,
      isLooping: false,
      isInvertible: true,
      isCompatibleWithTriggers: false,

      // list of parameters
      params: [
        {
          id: "tag",
          // The name of the parameter.
          name: "Tag",
          // The description of the parameter.
          desc: "Tag of the request",
          type: "string",
          value: "",
        },
      ],
      listName: "OnRequestResult",

      displayText: "On request result [i]{0}[/i]",

      description: "On result of tagged request",
    },
    OnRequestError: {
      // The category of the action as it appears in the add condition dialog
      category: "general",
      forward: "_OnRequestError",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      isTrigger: true,
      isFakeTrigger: false,
      isStatic: false,
      isLooping: false,
      isInvertible: true,
      isCompatibleWithTriggers: false,

      // list of parameters
      params: [
        {
          id: "tag",
          // The name of the parameter.
          name: "Tag",
          // The description of the parameter.
          desc: "Tag of the request error",
          type: "string",
          value: "",
        },
      ],
      listName: "OnRequestError",

      displayText: "On request error [i]{0}[/i]",

      description: "On error of tagged request",
    }
  },
    /*
    SampleCondition: {
      // The category of the action as it appears in the add condition dialog
      category: "general",

      // Forward to the instance function name
      forward: "_SampleAction",
      // Or specify a handler function
      handler: `function () {
        // Your code here
      }`,

      // Set to true to automatically generate a script interface for this condition
      // Cases where you might not want this are:
      // 1- If the condition params are incompatible with the script interface
      // 2- If you don't want it to appear in the script interface
      // 3- If the script interface has a better way to achieve the same thing
      autoScriptInterface: true,

      // Set to true to highlight the condition in the add condition dialog
      highlight: true,

      // Set to true to hide the condition in the interface. False by default if not specified.
      deprecated: false,

      // special conditions properties. These can all be omitted, and they will default to the following values:
      isTrigger: false,
      isFakeTrigger: false,
      isStatic: false,
      isLooping: false,
      isInvertible: true,
      isCompatibleWithTriggers: true,

      // list of parameters
      params: [
        {
          // The id of the parameter. This is used to generate the script interface.
          // It must be unique for each parameter.
          id: "param1",
          // The name of the parameter.
          name: "Param 1",
          // The description of the parameter.
          desc: "The first parameter",

          // The type of the parameter.
          type:
            // The following types can take a default value AND be automatically generated in the script interface
            - "string"
            - "number"
            - "any"
            - "boolean"

            // The following types can take a default value but CANNOT be automatically generated in the script interface
            - "combo"

            // The following types CANNOT take a default value AND CANNOT be automatically generated in the script interface
            - "cmp"
            - "object"
            - "objectname"
            - "layer"
            - "layout"
            - "keyb"
            - "instancevar"
            - "instancevarbool"
            - "eventvar"
            - "eventvarbool"
            - "animation"
            - "objinstancevar"

          // The default value of the parameter. Can be omitted if the type is not a string, number, any, boolean or combo.
          value: "the default value of the parameter",

          // Only for type "combo"
          items: [
            {"itemId1": "itemName1"},
            {"itemId2": "itemName2"},
            {"itemId3": "itemName3"},
          ],

          // Only for type "object"
          allowedPluginIds: ["Sprite", "TiledBg"],
        },
      ],

      // The name of the condition as it appears in the add condition dialog
      listName: "Sample Condition",

      // The text that appears in the event sheet. Note, every single param must be used in the display text.
      // You can also use [b] and [i] tags.
      displayText: "Sample condition [i]{0}[/i]",

      // The description of the condition as it appears in the add condition dialog
      description: "This is a sample condition",
    },
    */
  Exps: {
    RequestData: {
      category: "general",
      forward: "_RequestData",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      returnType: "any",
      isVariadicParameters: false,
      params: [
        {
          id: "tag",
          name: "Tag",
          desc: "Tag of the request",
          type: "string"
        },
      ],
      description: "Return the data from the last request with the tag as JSON string.",
    },
    RequestError: {
      category: "general",
      forward: "_RequestError",
      autoScriptInterface: true,
      highlight: false,
      deprecated: false,
      returnType: "any",
      isVariadicParameters: false,
      params: [
        {
          id: "tag",
          name: "Tag",
          desc: "Tag of the request error",
          type: "string"
        },
      ],
      description: "Return the error from the last request with the tag as JSON string.",
    },
  },
    /*
    SampleExpression: {
      // The category of the action as it appears in the expression picker
      category: "general",

      // Forward to the instance function name
      forward: "_SampleAction",
      // Or specify a handler function
      handler: `function () {
        // Your code here
      }`,

      // Set to true to automatically generate a script interface for this expression
      // Cases where you might not want this are:
      // 1- If you don't want it to appear in the script interface
      // 2- If the script interface has a better way to achieve the same thing
      autoScriptInterface: true,

      // Set to true to highlight the expression in the expression picker
      highlight: true,

      // Set to true to hide the expression in the interface. False by default if not specified.
      deprecated: false,

      // The type of the expression.
      returnType:
        - "string"
        - "number"
        - "any" // must be either string or number

      // Set to true if the expression is variadic. False by default if not specified.
      isVariadicParameters: false

      // list of parameters
      params: [
        {
          // The id of the parameter. This is used to generate the script interface.
          // It must be unique for each parameter.
          id: "param1",
          // The name of the parameter.
          name: "Param 1",
          // The description of the parameter.
          desc: "The first parameter",

          // The type of the parameter.
          type:
            // The following types can take a default value AND be automatically generated in the script interface
            - "string"
            - "number"
            - "any"
        },
      ],

      // The description of the expression as it appears in the expression picker
      description: "This is a sample expression",
    },
    */
};
