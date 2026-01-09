/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(async () => {
    console.log('Scripting API ready');

    // Required to "see" other players and click them for the Wave menu
    await WA.players.configureTracking();

    // --- CLOCK LOGIC ---
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)

    // --- WAVE & JOIN LOGIC ---

    // 1. Add the "Wave" button when you click on another person
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            // Get your current position to send to the other player so they can "Join" you
            const myPosition = await WA.player.getPosition();

            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    // 2. Listen for when someone waves at YOU
    WA.event.on('wave-event').subscribe((event) => {
        // We use "as any" to tell TypeScript to allow us to read the data
        const data = event.data as any;
        
        const sender = data.senderName;
        const targetX = data.senderX;
        const targetY = data.senderY;

        // This opens a popup on your screen with Join and Wave Back options
        WA.ui.openPopup("clockPopup", `${sender} is waving at you!`, [
            {
                label: "Join",
                className: "primary",
                callback: (popup) => {
                    // Automatically walk to the person who waved
                    WA.player.moveTo(targetX, targetY);
                    popup.close();
                }
            },
            {
                label: "Wave Back",
                className: "success",
                callback: (popup) => {
                    WA.chat.sendChatMessage(`You waved back at ${sender}!`);
                    popup.close();
                }
            },
            {
                label: "Close",
                className: "normal",
                callback: (popup) => {
                    popup.close();
                }
            }
        ]);
    });

    // Bootstraps the Extra library
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};