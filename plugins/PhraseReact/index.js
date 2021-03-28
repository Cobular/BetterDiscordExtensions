module.exports = (Plugin, Library) => {

  const {
    WebpackModules,
    DCM,
    PluginUtilities,
    Settings,
    Patcher
  } = Library;

  const Textbox = class Textbox extends Settings.Textbox {
    constructor(index, value, listener, options) {
      super(index, undefined, value, listener, options);

      this.m_index = index;
    }

    get index() {
      return this.m_index;
    }
  };

  return class PhraseReact extends Plugin {
    constructor() {
      super();

      this.letterEmojiStringReference = {
        "a": ["🅰️", "🇦"],
        "b": ["🅱️", "🇧"],
        "c": ["🇨"],
        "d": ["🇩"],
        "e": ["📧", "🇪"],
        "f": ["🇫"],
        "g": ["🇬"],
        "h": ["🇭"],
        "i": ["ℹ️", "🇮"],
        "j": ["🇯"],
        "k": ["🇰"],
        "l": ["🇱"],
        "m": ["Ⓜ️", "🇲"],
        "n": ["🇳"],
        "o": ["⭕", "🅾️", "🇴"],
        "p": ["🅿️", "🇵"],
        "q": ["🇶"],
        "r": ["🇷"],
        "s": ["🇸"],
        "t": ["🇹"],
        "u": ["🇺"],
        "v": ["🇻"],
        "w": ["🇼"],
        "x": ["✖️", "❌", "🇽"],
        "y": ["🇾"],
        "z": ["🇿"],
      };
      this.addReactionModule = WebpackModules.getByProps("addReaction");
      this.reactionDelayMS = 200;
      this.contextMenuPatches = [];
      this.emojiPhrases = {};
    }

    onStart() {
      this.loadSettings();
      this.updateEmojiPhrases();
      this.patchMessageContextMenu();
    }

    onStop() {
      this.unbindContextMenus();
    }

    unbindContextMenus() {
      for (const cancel of this.contextMenuPatches) cancel();
    }

    patchMessageContextMenu() {
      const MessageContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName == "MessageContextMenu");
      this.contextMenuPatches.push(Patcher.after(MessageContextMenu, "default", (_, [props], retVal) => {
        const original = retVal.props.children[0].props.children;
        const newOne = DCM.buildMenuItem({
          type: "submenu",
          label: "Reaction Phrases",
          items: Object.keys(this.emojiPhrases).filter((item) => {
            // Remove undefined (error state) keys
            return this.emojiPhrases[item] !== undefined;
          }).map((emojiPhraseString) => {
            return {
              type: "text",
              label: emojiPhraseString,
              action: () => {
                const message_data = {
                  message_id: props.message.id,
                  channel_id: props.message.channel_id
                };
                console.log({message_data});
                this.addReactionToMessage(message_data, this.emojiPhrases[emojiPhraseString]);
              }
            };
          })
        });
        if (Array.isArray(original)) {
          original.splice(1, 0, newOne);
        }
        else {
          retVal.props.children[0].props.children = [original, newOne];
        }
      }));
    }

    addReactionToMessage(messageData, emojiArray) {
      emojiArray.forEach((emoji, index) => {
        setTimeout(() => this.addSingleReactionToMessage(messageData, emoji), index * this.reactionDelayMS);
      });
    }

    addSingleReactionToMessage(messageData, emoji) {
      this.addReactionModule.addReaction(messageData.channel_id, messageData.message_id, {
        animated: false,
        id: null,
        name: emoji
      });
    }

    // Takes in a string and compares it to the known letter symbols, trying to use them as well as possible.
    // Will return either an array or undefined if we use too many chars
    stringToEmojiArray(inputString) {
      let emojiCount = this.objectMap(this.letterEmojiStringReference, (value) => {
        return value.length;
      });
      let outOfLetters = false;
      const emojiArray = inputString.toLowerCase().split("").filter((char) => {
        return this.letterEmojiStringReference[char] !== undefined;
      }).map((char) => {
        // Flip the flag to true, telling us to return an error from this function.
        if (emojiCount[char] - 1 < 0) {
          outOfLetters = true;
        }
        else {
          emojiCount[char]--;
          return this.letterEmojiStringReference[char][emojiCount[char]];
        }
      });
      if (outOfLetters) return undefined;
      return emojiArray;
    }

    objectMap(object, mapFn) {
      return Object.keys(object).reduce(function (result, key) {
        result[key] = mapFn(object[key]);
        return result;
      }, {});
    }

    getSettingsPanel() {
      const self = this;

      const panel = document.createElement("div");
      panel.className = "form";
      panel.style = "width:100%;";
      const phraseTextboxItems = new Settings.SettingGroup(this.getName(), {shown: true});

      function countPhrases(panel) {
        return panel.children[0].children[1].childElementCount - 1;
      }

      function addPhrase(listener, position, value = undefined) {
        const textBox = new Textbox(position + 1, value, listener, {placeholder: "Phrase"});
        phraseTextboxItems.append(textBox);
        return textBox;
      }

      const addPhraseButton = document.createElement("button");
      // TODO: remove hardcoded classes
      addPhraseButton.className = "button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN";
      addPhraseButton.style = "margin:5px;"
      addPhraseButton.addEventListener("click", () => {
        const textBox = addPhrase(() => {
        }, countPhrases(panel));
        self.settings.emojiPhrasesList.push("");
        textBox.addListener((text) => {
          self.updateSettingField(text, textBox.index - 1);
        });
      });
      addPhraseButton.innerText = "Add New Phrase";

      const removePhraseButton = document.createElement("button");
      // TODO: remove hardcoded classes
      removePhraseButton.className = "button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN";
      removePhraseButton.style = "margin:5px;"
      removePhraseButton.addEventListener("click", () => {
        panel.children[0].children[1].removeChild(panel.children[0].children[1].lastChild)
        self.settings.emojiPhrasesList.pop()
        this.updateEmojiPhrases()
        this.saveSettings()
      });
      removePhraseButton.innerText = "Remove Phrase";

      const buttonContainer = document.createElement("div")
      buttonContainer.className = "buttonContainer";
      buttonContainer.style = "width:100%; display:flex;";
      console.log(buttonContainer)
      buttonContainer.append(addPhraseButton)
      buttonContainer.append(removePhraseButton)

      phraseTextboxItems.appendTo(panel).append(buttonContainer)
      this.settings.emojiPhrasesList.forEach((phrase, index) => addPhrase((text) => {
        self.updateSettingField(text, index);
      }, index, phrase));
      return panel;
    }

    updateSettingField(text, index) {
      this.settings.emojiPhrasesList[index] = text;
      this.updateEmojiPhrases();
      this.saveSettings();
    }

    updateEmojiPhrases() {
      this.emojiPhrases = {};
      this.settings.emojiPhrasesList.forEach((phrase) => {
        const emojiPhrase = this.stringToEmojiArray(phrase);
        if (emojiPhrase)
          this.emojiPhrases[phrase] = emojiPhrase;
      });
    }

    get defaultSettings() {
      return {
        emojiPhrasesList: [
          "LMAO",
          "FUCK",
          "EE",
          "YIKES",
          "GAMER",
          "POG"
        ]
      };
    }

    loadSettings() {
      this.settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
    }

    saveSettings() {
      PluginUtilities.saveSettings(this.getName(), this.settings);
    }
  };
};
