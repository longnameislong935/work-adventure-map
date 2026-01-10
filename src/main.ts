/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.1.0"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

// 1. PRE-LOAD THE SOUND OBJECT (Global scope)
// According to docs: WA.sound.loadSound returns a Sound class object
const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Force permission check for desktop popups
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        try {
            const data = event.data as any;
            
            // --- PRIVACY FILTER ---
            // Only trigger sound/popup if I am the target or if it's a general broadcast
            if (data.targetId && data.targetId !== WA.player.id) {
                return;
            }

            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;
            const isResponse = data.isResponse;

            // 1. PLAY NATIVE SOUND
            // Using the configuration object format from the documentation
            waveSound.play({
                volume: 0.5,
                loop: false,
                rate: 1,
                detune: 1,
                delay: 0,
                seek: 0,
                mute: false
            });

            // 2. TRIGGER OS NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Back" : "New Wave", {
                    body: isResponse ? `${sender} waved back! 👋` : `${sender} is waving at you!`,
                });
            }

            // 3. VISUAL BANNER
            const waveMessage = isResponse ? `${sender} waved back! 👋` : `👋 ${sender} is waving! (Click for options)`;
            const waveNotice = WA.ui.displayActionMessage({
                message: waveMessage,
                type: "message",
                callback: () => {
                    if (isResponse) {
                        waveNotice.remove();
                    } else {
                        WA.ui.openPopup("clockPopup", `${sender} is waving!`, [
                            {
                                label: "Wave Back 👋",
                                className: "success",
                                callback: (popup) => {
                                    WA.event.broadcast('wave-event', { 
                                        senderName: WA.player.name, 
                                        targetId: data.senderId, // Wave back to the original sender
                                        isResponse: true 
                                    });
                                    popup.close();
                                    waveNotice.remove();
                                }
                            },
                            {
                                label: "Join 🚶",
                                className: "primary",
                                callback: (popup) => {
                                    WA.player.moveTo(targetX, targetY);
                                    popup.close();
                                    waveNotice.remove();
                                }
                            }
                        ]);
                    }
                }
            });
            setTimeout(() => { waveNotice.remove(); }, 30000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            // We use broadcast but include the target's ID for privacy
            WA.event.broadcast('wave-event', {
                senderId: WA.player.id,
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                targetId: remotePlayer.id, // The recipient's ID
                isResponse: false
            });
        });
    });

    bootstrapExtra().catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};