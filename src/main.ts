/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.5.0"; 
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
            new Notification("Office Wave", { body: `${data.senderName} is waving!` });
        }

        // 3. Interactive Banner
//        const waveNotice = WA.ui.displayActionMessage({
//            message: `👋 ${data.senderName} is waving! (Click to respond)`,
//            type: "message",
//            callback: () => {
//                // Open a choice menu for the receiver
//                WA.ui.openPopup("clockPopup", `${data.senderName} is waving! What would you like to do?`, [
//                    {
//                        label: "Wave Back 👋",
//                        className: "success",
//                        callback: (popup) => {
//                            // Send a wave back to the original sender
//                            WA.event.broadcast('wave-event', {
//                                senderId: WA.player.id,
//                                senderName: WA.player.name,
//                                senderX: 0, // Not needed for a simple response
//                                senderY: 0,
//                                targetId: data.senderId,
//                                isResponse: true
//                            });
//                            popup.close();
//                            waveNotice.remove();
//                        }
//                    },
//                    {
//                        label: "Talk / Walk to 🚶",
//                        className: "primary",
//                        callback: (popup) => {
//                            // Move to sender to trigger the built-in proximity talk
//                            WA.player.moveTo(data.senderX, data.senderY);
//                            popup.close();
//                            waveNotice.remove();
//                        }
//                    }
//                ]);
//            }
//        });
        const waveNotice = WA.ui.displayActionMessage({
            message: `👋 ${data.senderName} is waving! (Click to respond)`,
            type: "message",
            callback: () => {
                // Open a simple YES/NO menu for the receiver
                WA.ui.openPopup("clockPopup", `${data.senderName} is waving! Would you like to join them?`, [
                    {
                        label: "YES",
                        className: "success",
                        callback: (popup) => {
                            // 1. Move to the sender
                            WA.player.moveTo(data.senderX, data.senderY);
                            
                            // 2. Optional: Send a 'Wave Back' automatically so they know you're coming
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
                        label: "NO",
                        className: "error",
                        callback: (popup) => {
                            // Just close everything without moving
                            popup.close();
                            waveNotice.remove();
                        }
                    }
                ]);
            }
        });
        // Keep banner visible longer for choice
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