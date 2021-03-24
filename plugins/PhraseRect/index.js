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
    DOMTools,
    Patcher
  } = Library;

  return class HiddenChannels extends Plugin {
    constructor() {
      super();

      this.letterEmojiStringReference = {
        "a": ["regional_indicator_a", "a"],
        "b": ["regional_indicator_b", "b"],
        "c": ["regional_indicator_c", "email"],
        "d": ["regional_indicator_d"],
        "e": ["regional_indicator_e"],
        "f": ["regional_indicator_f"],
        "g": ["regional_indicator_g"],
        "h": ["regional_indicator_h"],
        "i": ["regional_indicator_i", "information_source"],
        "j": ["regional_indicator_j"],
        "k": ["regional_indicator_k"],
        "l": ["regional_indicator_l"],
        "m": ["regional_indicator_m", "m"],
        "n": ["regional_indicator_n"],
        "o": ["regional_indicator_o", "o2"],
        "p": ["regional_indicator_p", "parking"],
        "q": ["regional_indicator_q"],
        "r": ["regional_indicator_r"],
        "s": ["regional_indicator_s"],
        "t": ["regional_indicator_t"],
        "u": ["regional_indicator_u"],
        "v": ["regional_indicator_v"],
        "w": ["regional_indicator_w"],
        "x": ["regional_indicator_x", "x", "heavy_multiplication_x"],
        "y": ["regional_indicator_y"],
        "z": ["regional_indicator_z"],
      };

      this.letterEmojiCount = Object.keys(this.letterEmojiStringReference).map((key) => {
        return this.letterEmojiStringReference[key].length;
      });

      this.addReactionModule = WebpackModules.getByProps("addReaction")

      this.contextMenuPatches = [];
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
      const MessageContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName == "MessageContextMenu")
      this.contextMenuPatches.push(Patcher.after(MessageContextMenu, "default", (_, [props], retVal) => {
        const original = retVal.props.children[0].props.children;
        const newOne = DCM.buildMenuChildren({
          type: "group",
          items: [
            {
              type: "text",
              label: "🇫 🇺 🇨 🇰",
              action: () => {
                const message_data = {message_id: props.message.id, channel_id: props.message.channel_id}
                console.log({message_data});
                this.addReactionToMessage(message_data, ["🇫", "🇺", "🇨", "🇰"]);
              }
            }
          ]
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
      emojiArray.forEach((emoji) => {
        this.addSingleReactionToMessage(messageData, emoji)
      })
    }

    addSingleReactionToMessage(messageData, emoji) {
      this.addReactionModule.addReaction(messageData.channel_id, messageData.message_id, {animated: false, id: null, name: emoji})
    }
  };
};
