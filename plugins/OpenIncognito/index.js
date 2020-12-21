module.exports = (Plugin, Library) => {

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
