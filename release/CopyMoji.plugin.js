/**
 * @name CopyMoji
 * @donate true
 * @website https://github.com/JakeCover/BetterDiscordExtensions/tree/main/plugins/CopyMoji
 * @source https://raw.githubusercontent.com/JakeCover/BetterDiscordExtensions/main/release/CopyMoji.plugin.js
 */
/*@cc_on
@if (@_jscript)

	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"CopyMoji","authors":[{"name":"Cobular","discord_id":"249705405372956672","github_username":"JakeCover","twitter_username":"cobular_"}],"version":"1.1.0","description":"By default, when you select and copy text on discord with emojis in it, Discord decides that it should copy the message, not with the emojis as actual emojis, but as `:emojiName:` strings. For standard emojis, this behavior is really dumb!\nTo fix this, I made this plugin, which will change that default behavior. Instead of that, this will make it so that standard emojis (emojis that aren't set custom on a server) are actually copied the way you would expect, so they can be taken into other messaging apps or text documents!","github":"https://github.com/JakeCover/BetterDiscordExtensions/tree/main/plugins/CopyMoji","github_raw":"https://raw.githubusercontent.com/JakeCover/BetterDiscordExtensions/main/release/CopyMoji.plugin.js","paypalLink":"https://paypal.me/cobular"},"changelog":[{"title":"A few updates - 1.1.0","items":["Removed unused settings menu","Fixed potential memory leak","Significantly expanded on description","Removed unnecessary console log. Sorry about that!","Removed unnecessary content from meta tag"]},{"title":"Created Plugin - 1.0.0","items":["Created the plugin!!","Wowza!!"]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

  const {Logger, Settings, DOMTools} = Library;

  return class CopyMoji extends Plugin {
    constructor() {
      super();
      this.subscription = [];
      this.emojiLookup = {};
    }

    onStart() {
      // register an observer on emoji classes
      Logger.log("Started");
      this.subscription = DOMTools.observer.subscribeToQuerySelector(this.onEmojiRender, "img.emoji", this, true);
      this.generateEmojiMap(BdApi.findModuleByProps("EMOJI_NAME_RE").all());
    }

    onStop() {
      Logger.log("Stopped");
      DOMTools.observer.unsubscribe(this.subscription);
    }

    onEmojiRender(event) {
      try {
        // If the update is not of type childList, then we don't care
        event.forEach(mutationRecord => {
          if (mutationRecord.type === "childList") {
            // if (mutationRecord.addedNodes.length === 0) {
            //   Logger.log("No emojis added");
            // }

            mutationRecord.addedNodes.forEach(addedNode => {
              // If node isn't an element, then we don't care.
              if (addedNode.nodeType !== 1) {
                return;
              }
              let emojis = DOMTools.queryAll("img.emoji", addedNode.parentElement);
              emojis.forEach(emoji => {
                // If an emoji is nonstandard, return because we can't do anything about that.
                if (!this.checkEmojiIsStandard(emoji.alt.replace(/:/g, ""))) {
                  return;
                }
                emoji.alt = this.emojiLookup[emoji.alt.replace(/:/g, "")];
              });
            });
          }
        });
      } catch (e) {
        Logger.err(e);
      }
    }

    generateEmojiMap(emojis) {
      emojis.forEach(emoji => {
        emoji.names.forEach(emojiName => {
          this.emojiLookup[emojiName] = emoji.surrogates;
        });
      });
    }

    // Checks if an emoji is in the standard set, if so, return true
    checkEmojiIsStandard(name) {
      return this.emojiLookup[name] !== undefined;
    }
  };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
