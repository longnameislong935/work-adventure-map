/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.9.3"; 
const LOG_PREFIX = "[WA-WAVE]"; 

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);
    await bootstrapExtra();

    // 1. LISTENING FOR PRIVATE WAVES
    // Changed 'onPlayerEntered' to 'onPlayerEnters' to match your API version
    WA.players.onPlayerEnters().subscribe((remotePlayer: any) => {
        
        // Explicitly typing 'data' as any to satisfy the compiler
        remotePlayer.state.onVariableChange("waveData").subscribe((data: any) => {
            if (!data) return;
            
            // Checking against the player's unique ID (uuid)
            if (data.targetId !== WA.player.id) {
                return; 
            }

            console.log(`${LOG_PREFIX} Private wave received from ${data.senderName}`);

            // A. Play Sound (The door.ts way)
            try {
                WA.sound.loadSound("bell.mp3").play({ volume: 0.8 });
            } catch(e) {
                console.warn("Audio play blocked by browser.");
            }

            // B. Visual Banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${data.senderName} is waving at you!`,
                type: "message",
                callback: () => { 
                    WA.player.moveTo(remotePlayer.x, remotePlayer.y);
                    waveNotice.remove(); 
                }
            });
            setTimeout(() => { waveNotice.remove(); }, 20000);

            // C. Desktop Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Private Wave", {
                    body: `${data.senderName} is waving at you!`,
                    tag: `wave-${remotePlayer.uuid}`
                });
            }
        });
    });

    // 2. SENDING A PRIVATE WAVE
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            
            const currentData = WA.player.state.waveData as any;
            const newCount = (currentData?.count || 0) + 1;

            // Update MY state with the target's ID
            // We use remotePlayer.uuid as the unique identifier
            WA.player.state.waveData = {
                targetId: remotePlayer.uuid,
                senderName: WA.player.name,
                count: newCount
            };

            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};