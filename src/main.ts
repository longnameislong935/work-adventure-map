/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.5.1"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Live`);

    const unlockAudio = () => {
        try { waveSound.play({ volume: 0 }); } catch (err) {}
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        const data = event.data;
        if (!data || data.senderId === WA.player.id) return; 
        if (!data.targetId || data.targetId !== WA.player.id) return;

        // 1. Play Sound
        try { waveSound.play({ volume: 0.7 }); } catch (err) {}

        // 2. Desktop Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(data.isResponse ? "Wave Back" : "New Wave", { 
                body: data.isResponse ? `${data.senderName} waved back! 👋` : `${data.senderName} is waving at you!` 
            });
        }

        // 3. Interactive Banner
        const waveNotice = WA.ui.displayActionMessage({
            message: data.isResponse ? `👋 ${data.senderName} waved back!` : `👋 ${data.senderName} is waving! (Click to respond)`,
            type: "message",
            callback: () => {
                // If they click the banner, open the menu
                WA.ui.openPopup("clockPopup", `${data.senderName} is waving!`, [
                    {
                        label: "Wave Back 👋",
                        className: "success",
                        callback: (popup) => {
                            WA.event.broadcast('wave-event', {
                                senderId: WA.player.id,
                                senderName: WA.player.name,
                                targetId: data.senderId,
                                isResponse: true
                            });
                            popup.close();
                            waveNotice.remove();
                        }
                    },
                    {
                        label: "Talk / Walk to 🚶",
                        className: "primary",
                        callback: (popup) => {
                            WA.player.moveTo(data.senderX, data.senderY);
                            popup.close();
                            waveNotice.remove();
                        }
                    },
                    {
                        label: "Close",
                        className: "warning",
                        callback: (popup) => {
                            // This just closes the menu and removes the banner
                            popup.close();
                            waveNotice.remove();
                        }
                    }
                ]);
            }
        });
        
        setTimeout(() => { waveNotice.remove(); }, 30000);
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            const recipientId = remotePlayer.id || remotePlayer.uuid;

            WA.event.broadcast('wave-event', {
                senderId: WA.player.id, 
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                targetId: recipientId,
                isResponse: false
            });

            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra().catch(() => {});
});

export {};