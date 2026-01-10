/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.9.2"; 
const LOG_PREFIX = "[WA-WAVE]"; 

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);
    await bootstrapExtra();

    // 1. LISTENING FOR PRIVATE WAVES
    WA.players.onPlayerEntered().subscribe((remotePlayer) => {
        
        // Watch for changes on any player's 'waveData'
        remotePlayer.state.onVariableChange("waveData").subscribe((data) => {
            if (!data) return;
            const wave = data as { targetId: string, senderName: string, count: number };

            // THE FILTER: Only proceed if the wave was meant for ME
            if (wave.targetId !== WA.player.id) {
                return; 
            }

            console.log(`${LOG_PREFIX} Private wave received from ${wave.senderName}`);

            // A. Play Sound (The door.ts way)
            WA.sound.loadSound("bell.mp3").play({ volume: 0.8 });

            // B. Visual Banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${wave.senderName} is waving at you!`,
                type: "message",
                callback: () => { 
                    // Move to the sender's current position
                    WA.player.moveTo(remotePlayer.x, remotePlayer.y);
                    waveNotice.remove(); 
                }
            });
            setTimeout(() => { waveNotice.remove(); }, 20000);

            // C. Desktop Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Private Wave", {
                    body: `${wave.senderName} is waving at you!`,
                    tag: `wave-${remotePlayer.id}`
                });
            }
        });
    });

    // 2. SENDING A PRIVATE WAVE
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            
            // Get current count or start at 0
            const currentData = WA.player.state.waveData as any;
            const newCount = (currentData?.count || 0) + 1;

            // Update MY state with the target's ID
            // Everyone sees this update, but only the person with this ID will react
            WA.player.state.waveData = {
                targetId: remotePlayer.id,
                senderName: WA.player.name,
                count: newCount
            };

            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};