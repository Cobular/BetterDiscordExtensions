module.exports = (Plugin, Library) => {

  const {Logger, Patcher, Settings, DOMTools} = Library;

  return class ExamplePlugin extends Plugin {
    constructor() {
      super();
      this.defaultSettings = {};
      this.defaultSettings.color = "#ff0000";
      this.defaultSettings.option = 50;
      this.defaultSettings.keybind = [162, 74];
      this.defaultSettings.radio = "weiner";
      this.defaultSettings.slider1 = 30;
      this.defaultSettings.slider2 = 54;
      this.defaultSettings.textbox = "nothing";
      this.defaultSettings.switch1 = false;
      this.defaultSettings.switch2 = true;
      this.defaultSettings.switch3 = true;
      this.defaultSettings.switch4 = false;
      this.defaultSettings.file = undefined;
      this.subscriptions = [];
      this.emojiLookup = new Map();
    }

    onStart() {
      // register an observer on emoji classes
      Logger.log("Started");
      const subscription = DOMTools.observer.subscribeToQuerySelector(this.onEmojiRender, "img.emoji", this, true);
      this.subscriptions.push(subscription);
      this.generateEmojiMap(BdApi.findModuleByProps("EMOJI_NAME_RE").all());
    }

    onStop() {
      Logger.log("Stopped");
      Patcher.unpatchAll();
      this.subscriptions.forEach((value) => {
        DOMTools.observer.unsubscribe(value);
      });
    }

    onEmojiRender(event) {
      try {
        // If the update is not of type childList, then we don't care
        event.forEach(mutationRecord => {
          if (mutationRecord.type !== "childList") {
            return;
          }
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
        new Settings.SettingGroup("Example Plugin Settings").append(
          new Settings.Textbox("Textbox", "This should be a description of what this setting is about or blank", this.settings.textbox, (e) => {
            this.settings.textbox = e;
          }),
          new Settings.Dropdown("Select", "This should be a description of what this setting is about or blank", this.settings.option, [
            {
              label: "Test 1",
              value: "weiner"
            },
            {
              label: "Test 2",
              value: 50
            },
            {
              label: "Test 3",
              value: JSON.stringify({
                label: "Test 1",
                value: "weiner"
              })
            },
          ], (e) => {
            this.settings.option = e;
          }),
          new Settings.SettingGroup("Example Plugin SubSettings", {shown: true}).append(
            new Settings.RadioGroup("Generic RadioGroup", "This should be a description of what this setting is about or blank", this.settings.radio, [
              {
                name: "Test 1",
                value: "weiner",
                desc: "This is the first test",
                color: "#ff0000"
              },
              {
                name: "Test 2",
                value: 50,
                desc: "This is the second test",
                color: "#00ff00"
              },
              {
                name: "Test 3",
                value: JSON.stringify({
                  label: "Test 1",
                  value: "weiner"
                }),
                desc: "This is the third test",
                color: "#0000ff"
              },
            ], (e) => {
              this.settings.radio = e;
            }),
            new Settings.Switch("Switch1", "This should be a description of what this setting is about or blank", this.settings.switch1, (e) => {
              this.settings.switch1 = e;
            }),
            new Settings.Switch("Switch2", "This should be a description of what this setting is about or blank", this.settings.switch2, (e) => {
              this.settings.switch2 = e;
            }),
            new Settings.Switch("Switch3", "This should be a description of what this setting is about or blank", this.settings.switch3, (e) => {
              this.settings.switch3 = e;
            }),
            new Settings.Switch("Switch4", "This should be a description of what this setting is about or blank", this.settings.switch4, (e) => {
              this.settings.switch4 = e;
            })
          )
        ),

        new Settings.SettingGroup("Example Advanced Settings").append(
          new Settings.ColorPicker("Color Example", "This should be a description of what this setting is about or blank", this.settings.color, (e) => {
            this.settings.color = e;
          }),
          new Settings.Keybind("Keybind", "This should be a description of what this setting is about or blank", this.settings.keybind, (e) => {
            this.settings.keybind = e;
          }),
          new Settings.Slider("Slider", "This should be a description of what this setting is about or blank", 0, 100, this.settings.slider1, (e) => {
            this.settings.slider1 = e;
          }),
          new Settings.Slider("Slider2", "This should be a description of what this setting is about or blank", 0, 90, this.settings.slider2, (e) => {
            this.settings.slider2 = e;
          }, {
            markers: [0, 9, 18, 27, 36, 45, 54, 63, 72, 81, 90],
            stickToMarkers: true
          }),
          new Settings.FilePicker("FilePicker", "This should be a description of what this setting is about or blank", (e) => {
            if (e) this.settings.file = e.path;
          })
        )
      );
    }
  };

};
