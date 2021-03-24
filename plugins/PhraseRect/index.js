module.exports = (Plugin, Library) => {

  const {
    Logger,
    WebpackModules,
    DiscordAPI,
    Utilities,
    DiscordSelectors,
    DCM,
    PluginUtilities,
    DiscordModules,
    Settings,
    Patcher
  } = Library;

  return class HiddenChannels extends Plugin {
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

      this.emojiPhrases = {
        "FUCK": this.stringToEmojiArray("FUCK"),
        "SHIT": this.stringToEmojiArray("SHIT"),
        "PENIS": this.stringToEmojiArray("PENIS"),
        "UCLA": this.stringToEmojiArray("UCLA"),
        "GAY": this.stringToEmojiArray("GAY"),
      };
    }

    getSettingsPanel() {
      return Settings.SettingPanel().build()
    }

    onStart() {
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
  };
};
