/**
 * @name OpenIncognito
 * @invite 
 * @authorLink 
 * @donate true
 * @patreon 
 * @website https://github.com/JakeCover/BetterDiscordExtensions/tree/main/plugins/OpenIncognito
 * @source https://raw.githubusercontent.com/JakeCover/BetterDiscordExtensions/main/release/OpenIncognito.plugin.js
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
    const config = {"info":{"name":"OpenIncognito","authors":[{"name":"Cobular","discord_id":"249705405372956672","github_username":"JakeCover","twitter_username":"cobular_"}],"version":"1.0.0","description":"A BetterDiscord plugin to enable the opening of links in discord in incognito mode, automatically!","github":"https://github.com/JakeCover/BetterDiscordExtensions/tree/main/plugins/OpenIncognito","github_raw":"https://raw.githubusercontent.com/JakeCover/BetterDiscordExtensions/main/release/OpenIncognito.plugin.js","paypalLink":"https://paypal.me/cobular"},"changelog":[{"title":"Created Plugin","items":["Created the plugin!!","Wowza!!"]}],"main":"index.js"};

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

  const {Logger, Settings, DOMTools, DiscordContextMenu} = Library;

  return class OpenIncognito extends Plugin {
    constructor() {
      super();
      this.subscriptions = [];
      this.emojiLookup = {};
    }

    onStart() {
      // register an observer on emoji classes
      Logger.log("Started");
      console.log(DiscordContextMenu.getDiscordMenu())
      this.subscriptions.push(subscription);
      this.generateEmojiMap(BdApi.findModuleByProps("EMOJI_NAME_RE").all());
    }

    onStop() {
      Logger.log("Stopped");
      this.subscriptions.forEach((value) => {
        DOMTools.observer.unsubscribe(value);
      });
    }

    onEmojiRender(event) {
      try {
        // If the update is not of type childList, then we don't care
        event.forEach(mutationRecord => {
          if (mutationRecord.type === "childList") {
            if (mutationRecord.addedNodes.length === 0) {
              Logger.log("No emojis added");
            }

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

    getSettingsPanel() {
      return Settings.SettingPanel.build(this.saveSettings.bind(this),
          new Settings.Textbox("Textbox", "This should be a description of what this setting is about or blank", this.settings.textbox, (e) => {this.settings.textbox = e;}),
          new Settings.Dropdown("Select", "This should be a description of what this setting is about or blank", this.settings.option, [
            {label: "Test 1", value: "weiner"},
            {label: "Test 2", value: 50},
            {label: "Test 3", value: JSON.stringify({label: "Test 1", value: "weiner"})},
          ], (e) => {this.settings.option = e;}),
          new Settings.SettingGroup("Example Plugin SubSettings", {shown: true}).append(
            new Settings.RadioGroup("Generic RadioGroup", "This should be a description of what this setting is about or blank", this.settings.radio, [
              {name: "Test 1", value: "weiner", desc: "This is the first test", color: "#ff0000"},
              {name: "Test 2", value: 50, desc: "This is the second test", color: "#00ff00"},
              {name: "Test 3", value: JSON.stringify({label: "Test 1", value: "weiner"}), desc: "This is the third test", color: "#0000ff"},
            ], (e) => {this.settings.radio = e;}),
            new Settings.Switch("Switch1", "This should be a description of what this setting is about or blank", this.settings.switch1, (e) => {this.settings.switch1 = e;}),
            new Settings.Switch("Switch2", "This should be a description of what this setting is about or blank", this.settings.switch2, (e) => {this.settings.switch2 = e;}),
            new Settings.Switch("Switch3", "This should be a description of what this setting is about or blank", this.settings.switch3, (e) => {this.settings.switch3 = e;}),
            new Settings.Switch("Switch4", "This should be a description of what this setting is about or blank", this.settings.switch4, (e) => {this.settings.switch4 = e;})
          )
      );
    }
  };

};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/