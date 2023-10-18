const fs = require("fs");
const path = require("path");

// get command line arguments
const args = process.argv.slice(2);
const devBuild = args.includes("--dev");

function removeFilesRecursively(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function (file) {
      var curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        removeFilesRecursively(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

const camelCasedMap = new Map();

function camelCasify(str) {
  // If the string is already camelCased, return it
  if (camelCasedMap.has(str)) {
    return camelCasedMap.get(str);
  }
  // Replace any non-valid JavaScript identifier characters with spaces
  let cleanedStr = str.replace(/[^a-zA-Z0-9$_]/g, " ");

  // Split the string on spaces
  let words = cleanedStr.split(" ").filter(Boolean);

  // Capitalize the first letter of each word except for the first one
  for (let i = 1; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  // Join the words back together
  let result = words.join("");

  // If the first character is a number, prepend an underscore
  if (!isNaN(parseInt(result.charAt(0)))) {
    result = "_" + result;
  }

  camelCasedMap.set(str, result);

  return result;
}

function getFileListFromConfig(config) {
  const files = [];
  if (config.domSideScripts) {
    config.domSideScripts.forEach(function (file) {
      files.push(`c3runtime/${file}`);
    });
  }

  if (config.fileDependencies) {
    config.fileDependencies.forEach(function (file) {
      // files.push(`c3runtime/${file.filename}`);
      files.push(`${file.filename}`);
    });
  }

  if (config.info.defaultImageUrl) {
    files.push(`c3runtime/${config.info.defaultImageUrl}`);
  }

  return files;
}

function addonFromConfig(config) {
  return {
    "is-c3-addon": true,
    type: config.addonType,
    name: config.name,
    id: config.id,
    version: config.version,
    author: config.author,
    website: config.website,
    documentation: config.documentation,
    description: config.description,
    "editor-scripts": ["editor.js"],
    "file-list": [
      "c3runtime/actions.js",
      "c3runtime/conditions.js",
      "c3runtime/expressions.js",
      "c3runtime/instance.js",
      "c3runtime/plugin.js",
      "c3runtime/type.js",
      "lang/en-US.json",
      "aces.json",
      "addon.json",
      config.icon ? config.icon : "icon.svg",
      "editor.js",
      ...getFileListFromConfig(config),
    ],
  };
}

function langFromConfig(config) {
  let id = config.id.toLowerCase();
  const lang = {
    languageTag: "en-US",
    fileDescription: `Strings for ${id}.`,
    text: {},
  };

  let root;
  if (config.addonType === "plugin") {
    lang.text.plugins = {};
    lang.text.plugins[id] = {};
    root = lang.text.plugins[id];
  } else if (config.addonType === "behavior") {
    lang.text.behaviors = {};
    lang.text.behaviors[id] = {};
    root = lang.text.behaviors[id];
  } else if (config.addonType === "effect") {
    lang.text.effects = {};
    lang.text.effects[id] = {};
    root = lang.text.effects[id];
  } else {
    throw new Error("Invalid addon type");
  }
  root.name = config.name;
  root.description = config.description;
  root["help-url"] = config.documentation;
  root.aceCategories = config.aceCategories;
  root.properties = {};
  config.properties.forEach((property) => {
    root.properties[property.id] = {
      name: property.name,
      desc: property.desc,
    };
    if (property.type === "combo") {
      root.properties[property.id].items = {};
      property.options.items.forEach((item) => {
        const key = Object.keys(item)[0];
        root.properties[property.id].items[key] = item[key];
      });
    } else if (property.type === "link") {
      root.properties[property.id]["link-text"] = property.linkText;
    }
  });

  root.actions = {};
  Object.keys(config.Acts).forEach((key) => {
    const action = config.Acts[key];
    root.actions[key] = {
      "list-name": action.listName,
      "display-text": action.displayText,
      description: action.description,
      params: {},
    };

    action.params.forEach((param) => {
      root.actions[key].params[param.id] = {
        name: param.name,
        desc: param.desc,
      };
      if (param.type === "combo") {
        root.actions[key].params[param.id].items = {};
        param.items.forEach((item) => {
          const itemkey = Object.keys(item)[0];
          root.actions[key].params[param.id].items[itemkey] = item[itemkey];
        });
      }
    });
  });

  root.conditions = {};
  Object.keys(config.Cnds).forEach((key) => {
    const condition = config.Cnds[key];
    root.conditions[key] = {
      "list-name": condition.listName,
      "display-text": condition.displayText,
      description: condition.description,
      params: {},
    };

    condition.params.forEach((param) => {
      root.conditions[key].params[param.id] = {
        name: param.name,
        desc: param.desc,
      };
      if (param.type === "combo") {
        root.conditions[key].params[param.id].items = {};
        param.items.forEach((item) => {
          const itemkey = Object.keys(item)[0];
          root.conditions[key].params[param.id].items[itemkey] = item[itemkey];
        });
      }
    });
  });

  root.expressions = {};
  Object.keys(config.Exps).forEach((key) => {
    const expression = config.Exps[key];
    root.expressions[key] = {
      "translated-name": key,
      description: expression.description,
      params: {},
    };

    expression.params.forEach((param) => {
      root.expressions[key].params[param.id] = {
        name: param.name,
        desc: param.desc,
      };
      if (param.type === "combo") {
        root.expressions[key].params[param.id].items = {};
        param.items.forEach((item) => {
          const itemkey = Object.keys(item)[0];
          root.expressions[key].params[param.id].items[itemkey] = item[itemkey];
        });
      }
    });
  });

  return lang;
}

function acesFromConfig(config) {
  const aces = {};

  Object.keys(config.aceCategories).forEach((category) => {
    aces[category] = {
      conditions: Object.keys(config.Cnds)
        .filter((key) => config.Cnds[key].category === category)
        .map((key) => {
          const ace = config.Cnds[key];
          const ret = {
            id: key,
            scriptName: camelCasify(key),
          };
          Object.keys(ace).forEach((key) => {
            switch (key) {
              case "category":
              case "forward":
              case "handler":
              case "autoScriptInterface":
              case "listName":
              case "displayText":
              case "description":
              case "params":
                break;
              default:
                ret[key] = ace[key];
            }
          });
          if (ace.params) {
            ret.params = ace.params.map((param) => {
              const ret = {};
              Object.keys(param).forEach((key) => {
                switch (key) {
                  case "name":
                  case "desc":
                  case "items":
                    break;
                  default:
                    ret[key] = param[key];
                }
              });
              if (param.items) {
                ret.items = param.items.map((item) => Object.keys(item)[0]);
              }

              return ret;
            });
          }
          return ret;
        }),
      actions: Object.keys(config.Acts)
        .filter((key) => config.Acts[key].category === category)
        .map((key) => {
          const ace = config.Acts[key];
          const ret = {
            id: key,
            scriptName: camelCasify(key),
          };
          Object.keys(ace).forEach((key) => {
            switch (key) {
              case "category":
              case "forward":
              case "handler":
              case "autoScriptInterface":
              case "listName":
              case "displayText":
              case "description":
              case "params":
                break;
              default:
                ret[key] = ace[key];
            }
          });
          if (ace.params) {
            ret.params = ace.params.map((param) => {
              const ret = {};
              Object.keys(param).forEach((key) => {
                switch (key) {
                  case "name":
                  case "desc":
                  case "items":
                    break;
                  default:
                    ret[key] = param[key];
                }
              });
              if (param.items) {
                ret.items = param.items.map((item) => Object.keys(item)[0]);
              }

              return ret;
            });
          }
          return ret;
        }),
      expressions: Object.keys(config.Exps)
        .filter((key) => config.Exps[key].category === category)
        .map((key) => {
          const ace = config.Exps[key];
          const ret = {
            id: key,
            scriptName: camelCasify(key),
            expressionName: camelCasify(key),
          };
          Object.keys(ace).forEach((key) => {
            switch (key) {
              case "category":
              case "forward":
              case "handler":
              case "autoScriptInterface":
              case "listName":
              case "displayText":
              case "description":
              case "params":
                break;
              default:
                ret[key] = ace[key];
            }
          });
          if (ace.params) {
            ret.params = ace.params.map((param) => {
              const ret = {};
              Object.keys(param).forEach((key) => {
                switch (key) {
                  case "name":
                  case "desc":
                  case "items":
                    break;
                  default:
                    ret[key] = param[key];
                }
              });
              if (param.items) {
                ret.items = param.items.map((item) => Object.keys(item)[0]);
              }

              return ret;
            });
          }
          return ret;
        }),
    };
  });

  return aces;
}

if (fs.existsSync("./export")) {
  removeFilesRecursively("./export");
}

// create lang and c3runtime folders
fs.mkdirSync("./export");
fs.mkdirSync("./export/lang");
fs.mkdirSync("./export/c3runtime");

// create empty file called actions.js in c3runtime folder
const emptyFiles = [
  "actions.js",
  "conditions.js",
  "expressions.js",
  "instance.js",
  "type.js",
];
emptyFiles.forEach((file) => {
  fs.closeSync(fs.openSync(`./export/c3runtime/${file}`, "w"));
});

// import config from config.js
const config = require("./src/pluginConfig.js");

const addonJson = addonFromConfig(config);
// write addon.json
fs.writeFileSync("./export/addon.json", JSON.stringify(addonJson, null, 2));

const lang = langFromConfig(config);
// write lang/en-US.json
fs.writeFileSync("./export/lang/en-US.json", JSON.stringify(lang, null, 2));

const aces = acesFromConfig(config);
// write aces.json
fs.writeFileSync("./export/aces.json", JSON.stringify(aces, null, 2));

// copy icon.svg
if (config.icon) {
  fs.copyFileSync("./src/" + config.icon, "./export/" + config.icon);
} else {
  fs.copyFileSync("./src/icon.svg", "./export/icon.svg");
}

fs.copyFileSync("./construct-plugin/Steam_x64.ext.dll", "./src/Steam_plus_x64.ext.dll");

function getEditorPluginInfoFromConfig(config) {
  const editorPluginInfo = {
    id: config.id,
    version: config.version,
    category: config.category,
    author: config.author,
    addonType: config.addonType,
    info: config.info,
    domSideScripts: config.domSideScripts,
    fileDependencies: config.fileDependencies,
    icon: config.icon,
    type: config.type
  };
  //return "const BEHAVIOR_INFO = " + JSON.stringify(editorPluginInfo, null, 2);
  return `const PLUGIN_INFO = {
    ...${JSON.stringify(editorPluginInfo, null, 2)},
    properties: [
      ${config.properties
        .map((property) => {
          const options = {
            ...property.options,
          };
          delete options.infoCallback;
          delete options.linkCallback;
          delete options.items;
          return `{
            type: "${property.type}",
            id: "${property.id}",
            options: {
              ...${JSON.stringify(options, null, 2)},
              ${
                property.options.hasOwnProperty("infoCallback")
                  ? `infoCallback: ${property.options.infoCallback},`
                  : ""
              }
              ${
                property.options.hasOwnProperty("linkCallback")
                  ? `linkCallback: ${property.options.linkCallback},`
                  : ""
              }
              ${
                property.options.hasOwnProperty("items")
                  ? `items: ${JSON.stringify(
                      property.options.items.map((x) => Object.keys(x)[0]),
                      null,
                      2
                    )},`
                  : ""
              }
            },
          }`;
        })
        .join(",\n")}
    ],
  };`;
}

// write editor.js and replace "//<-- PLUGIN_INFO -->" with the plugin info
const editor = fs.readFileSync("./src/editor.js", "utf8");
const editorPluginInfo = getEditorPluginInfoFromConfig(config);
const editorWithPluginInfo = editor.replaceAll(
  "//<-- PLUGIN_INFO -->",
  editorPluginInfo
);
fs.writeFileSync("./export/editor.js", editorWithPluginInfo);

function getRuntimePluginInfoFromConfig(config) {
  return `const PLUGIN_INFO = {
  id: "${config.id}",
  type: "${config.type}",
  hasDomSide: ${config.domSideScripts && config.domSideScripts.length > 0},
  Acts: {
    ${Object.keys(config.Acts)
      .map((key) => {
        return `"${key}": {
          ${
            config.Acts[key].hasOwnProperty("forward")
              ? `"forward": (inst) => inst.${config.Acts[key].forward},`
              : ""
          }
          ${
            config.Acts[key].hasOwnProperty("handler")
              ? `"handler": ${config.Acts[key].handler},`
              : ""
          }
          ${
            config.Acts[key].hasOwnProperty("autoScriptInterface")
              ? `"autoScriptInterface": ${config.Acts[key].autoScriptInterface},`
              : ""
          }
          }`;
      })
      .join(",\n")}
  },
  Cnds: {
    ${Object.keys(config.Cnds)
      .map((key) => {
        return `"${key}": {
          ${
            config.Cnds[key].hasOwnProperty("forward")
              ? `"forward": (inst) => inst.${config.Cnds[key].forward},`
              : ""
          }
          ${
            config.Cnds[key].hasOwnProperty("handler")
              ? `"handler": ${config.Cnds[key].handler},`
              : ""
          }
          ${
            config.Cnds[key].hasOwnProperty("autoScriptInterface")
              ? `"autoScriptInterface": ${config.Cnds[key].autoScriptInterface},`
              : ""
          }
        }`;
      })
      .join(",\n")}
  },
  Exps: {
    ${Object.keys(config.Exps)
      .map((key) => {
        return `"${key}": {
          ${
            config.Exps[key].hasOwnProperty("forward")
              ? `"forward": (inst) => inst.${config.Exps[key].forward},`
              : ""
          }
          ${
            config.Exps[key].hasOwnProperty("handler")
              ? `"handler": ${config.Exps[key].handler},`
              : ""
          }
          ${
            config.Exps[key].hasOwnProperty("autoScriptInterface")
              ? `"autoScriptInterface": ${config.Exps[key].autoScriptInterface},`
              : ""
          }
        }`;
      })
      .join(",\n")}
  },
};`;
}

// write plugin.js and replace "//<-- PLUGIN_INFO -->" with the plugin info
const plugin = fs.readFileSync("./src/plugin.js", "utf8");
const instance = fs.readFileSync("./src/instance.js", "utf8");
const scriptInterface = fs.readFileSync("./src/scriptInterface.js", "utf8");
const pluginPluginInfo = getRuntimePluginInfoFromConfig(config);
const pluginWithPluginInfo = plugin
  .replaceAll("//<-- PLUGIN_INFO -->", pluginPluginInfo)
  .replaceAll("//<-- INSTANCE -->", instance)
  .replaceAll("//<-- SCRIPT_INTERFACE -->", scriptInterface);

fs.writeFileSync("./export/c3runtime/plugin.js", pluginWithPluginInfo);

if (config.domSideScripts) {
  config.domSideScripts.forEach((script) => {
    const domSide = fs.readFileSync(
      path.join(__dirname, "src", script),
      "utf8"
    );
    const domSideWithId = domSide.replaceAll(
      "//<-- DOM_COMPONENT_ID -->",
      `const DOM_COMPONENT_ID = "${config.id}";`
    );
    fs.writeFileSync(
      path.join(__dirname, "export", "c3runtime", script),
      domSideWithId
    );
  });
}

if (config.fileDependencies) {
  config.fileDependencies.forEach((file) => {
    fs.copyFileSync(
      path.join(__dirname, "src", file.filename),
      path.join(__dirname, "export", file.filename)
      // path.join(__dirname, "export", "c3runtime", file.filename)
    );
  });
}

if (config.info.defaultImageUrl) {
  fs.copyFileSync(
    path.join(__dirname, "src", config.info.defaultImageUrl),
    path.join(__dirname, "export", "c3runtime", config.info/defaultImageUrl)
  );
}

if (!devBuild) {
  // zip the content of the export folder and name it with the plugin id and version and use .c3addon as extension
  var AdmZip = require("adm-zip");
  const zip = new AdmZip();
  zip.addLocalFolder("./export/c3runtime", "c3runtime");
  zip.addLocalFolder("./export/lang", "lang");

  // for each remaining file in the root export folder
  fs.readdirSync("./export").forEach((file) => {
    // if the file is not the c3runtime or lang folder
    if (file !== "c3runtime" && file !== "lang") {
      // add it to the zip
      zip.addLocalFile(`./export/${file}`, "");
    }
  });

  // if dist folder does not exist, create it
  if (!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
  }
  zip.writeZip(`./dist/${config.id}-${config.version}.c3addon`);
}
