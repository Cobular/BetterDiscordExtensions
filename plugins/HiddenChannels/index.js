module.exports = (Plugin, Library) => {

  const {
    Logger,
    DiscordModules,
    Modals,
    WebpackModules,
    ReactTools,
    DiscordAPI,
    DCM
  } = Library;
  const React = DiscordModules.React;

  return class HiddenChannels extends Plugin {
    constructor() {
      super();
      this.requestOptions = {};
    }

    onStart() {
      const myHeaders = new Headers();
      myHeaders.append("authorization", WebpackModules.getByProps("getSessionId").getToken());
      this.requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };
      const serverId = "806816509170679808";
      this.getHiddenChannels(serverId).then(
        hiddenChannels => {
          console.log(hiddenChannels);
        }
      );
    }

    async getHiddenChannels(serverId) {
      let response = await fetch(`https://discord.com/api/v8/guilds/${serverId}/channels`, this.requestOptions);
      let allChannels = await response.json();
      const guild = DiscordAPI.Guild.fromId(serverId);
      const visibleChannelIds = guild.channels.map(channel => {
        return channel.discordObject.id;
      });
      this.showChannelModal()
      return this.filterHiddenChannels(allChannels, visibleChannelIds);
    }

    showChannelModal() {
      const modalChildren = this.createElements()
      console.log({modalChildren})
      Modals.showModal("Hidden Channels", modalChildren);
    }

    createElements() {
      const newDiv = document.createElement("aaaaaa");
      newDiv.className = "test"
      newDiv.appendChild(document.createTextNode("asdfasdfas"))

      return ReactTools.createWrappedElement(newDiv);
    }

    createModal(title, displayRoles, referenceRoles, isOverride = false) {
      if (!referenceRoles) referenceRoles = displayRoles;
      const modal = DOMTools.createElement(Utilities.formatTString(Utilities.formatTString(this.modalHTML, this.strings.modal), {name: escapeHTML(title)}));
      modal.querySelector(".callout-backdrop").addEventListener("click", () => {
        modal.classList.add("closing");
        setTimeout(() => {modal.remove();}, 300);
      });

      const strings = DiscordModules.Strings;
      for (const r in displayRoles) {
        const role = Array.isArray(displayRoles) ? displayRoles[r] : r;
        const user = UserStore.getUser(role) || {avatarURL: AvatarDefaults.DEFAULT_AVATARS[Math.floor(Math.random() * AvatarDefaults.DEFAULT_AVATARS.length)], username: role};
        const member = MemberStore.getMember(DiscordModules.SelectedGuildStore.getGuildId(), role) || {colorString: ""};
        const item = DOMTools.createElement(!isOverride || displayRoles[role].type == 0 ? this.modalButton : Utilities.formatTString(this.modalButtonUser, {avatarUrl: user.avatarURL}));
        if (!isOverride || displayRoles[role].type == 0) item.style.color = referenceRoles[role].colorString;
        else item.style.color = member.colorString;
        if (isOverride) item.querySelector(".role-name").innerHTML = escapeHTML(displayRoles[role].type == 0 ? referenceRoles[role].name : user.username);
        else item.querySelector(".role-name").innerHTML = escapeHTML(referenceRoles[role].name);
        modal.querySelector(".role-scroller").append(item);
        item.addEventListener("click", () => {
          modal.querySelectorAll(".role-item.selected").forEach(e => e.removeClass("selected"));
          item.classList.add("selected");
          const allowed = isOverride ? displayRoles[role].allow : referenceRoles[role].permissions;
          const denied = isOverride ? displayRoles[role].deny : null;

          const permList = modal.querySelector(".perm-scroller");
          permList.innerHTML = "";
          for (const perm in DiscordPerms) {
            const element = DOMTools.createElement(this.modalItem);
            const permAllowed = (allowed & DiscordPerms[perm]) == DiscordPerms[perm];
            const permDenied = isOverride ? (denied & DiscordPerms[perm]) == DiscordPerms[perm] : !permAllowed;
            if (!permAllowed && !permDenied) continue;
            if (permAllowed) {
              element.classList.add("allowed");
              element.prepend(DOMTools.createElement(this.permAllowedIcon));
            }
            if (permDenied) {
              element.classList.add("denied");
              element.prepend(DOMTools.createElement(this.permDeniedIcon));
            }
            element.querySelector(".perm-name").textContent = strings[perm] || perm.split("_").map(n => n[0].toUpperCase() + n.slice(1).toLowerCase()).join(" ");
            permList.append(element);
          }
        });
        item.addEventListener("contextmenu", (e) => {
          DCM.openContextMenu(e, DCM.buildMenu([
            {label: DiscordModules.Strings.COPY_ID, action: () => {DiscordModules.ElectronModule.copy(role);}}
          ]));
        });
      }

      modal.querySelector(".role-item").click();

      return modal;
    }


    filterHiddenChannels(allChannels, visibleChannels) {
      return allChannels.filter(channel => {
        return !visibleChannels.includes(channel.id);
      });
    }

    onStop() {
      Logger.log("Stopped");
    }
  };
};
