module.exports = (Plugin, Library) => {

  const {Logger, DOMTools} = Library;

  return class CopyMoji extends Plugin {
    constructor() {
      super();
      this.subscription = [];
      this.emojiLookup = {};
    }

    onStart() {
      // register an observer on emoji classes
      this.subscription = DOMTools.observer.subscribeToQuerySelector(this.onEmojiRender, "img.emoji", this, true);
      this.generateEmojiMap(BdApi.findModuleByProps("EMOJI_NAME_RE").all());
    }

    onStop() {
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
