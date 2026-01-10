/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "4.5.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Fixed Build`);

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
            new Notification("Office Wave", { body: `${data.senderName} is waving!` });
        }

        // 3. Interactive Banner
        const joinAction = WA.ui.displayActionMessage({
            message: `Click 'Close' to Walk over to ${data.senderName} 🚶`,
            type: "message",
            callback: () => {
                WA.player.moveTo(data.senderX, data.senderY);
                
                WA.event.broadcast('wave-event', {
                    senderId: WA.player.id,
                    senderName: WA.player.name,
                    targetId: data.senderId,
                    isResponse: true
                });
            }
        });

        // Keep banner visible for exactly 20 seconds
        setTimeout(() => { 
            try { joinAction.remove(); } catch(e) {}
        }, 20000);
    }); // <--- This was the missing closing brace for the receiver

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

    bootstrapExtra().catch((e: any) => console.error("Extra error", e));

}).catch(err => console.error("Init error", err));

export {};