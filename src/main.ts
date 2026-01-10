/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "4.3.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Walk Over Popup`);

    const unlockAudio = () => {
        try { waveSound.play({ volume: 0 }); } catch (err) {}
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        const data = event.data;
        if (!data || data.senderId === WA.player.id || data.targetId !== WA.player.id) return;

        // 1. Play Sound
        try { waveSound.play({ volume: 0.8 }); } catch (err) {}

        // 2. Open the Screen-Center Popup
        // We use "" as the target to bypass the Tiled requirement
        const wavePopup = WA.ui.openPopup("", `👋 ${data.senderName} is waving at you!`, [
            {
                label: "Walk over",
                className: "success",
                callback: (popup) => {
                    // Action: Move to sender
                    WA.player.moveTo(data.senderX, data.senderY);
                    
                    // Send automated Wave Back
                    WA.event.broadcast('wave-event', {
                        senderId: WA.player.id,
                        senderName: WA.player.name,
                        targetId: data.senderId,
                        isResponse: true
                    });

                    popup.close();
                }
            },
            {
                label: "Dismiss",
                className: "normal",
                callback: (popup) => {
                    popup.close();
                }
            }
        ]);

        // 3. Keep open for 20 seconds
        setTimeout(() => {
            try { wavePopup.close(); } catch (e) {}
        }, 20000);
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