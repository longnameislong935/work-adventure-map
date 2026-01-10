/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

// This is the main block that runs when the map loads
WA.onInit().then(async () => {
    console.log('Scripting API ready');

    // This line is vital: it allows your script to "talk" to other players
    await WA.players.configureTracking();

    // --- SECTION 1: THE CLOCK ---
    // This handles your existing clock logic
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)

    // --- SECTION 2: SENDING A WAVE ---
    // This adds the "Wave" button when you click on someone else
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            // Get your coordinates so the other person knows where to walk
            const myPosition = await WA.player.getPosition();

            // Send the wave data to that specific person
            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            
            // Show a confirmation in your own chat so you know it sent
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    // --- SECTION 3: RECEIVING A WAVE ---
    // This part catches the wave sent by someone else
    WA.event.on('wave-event').subscribe((event) => {
        // 'as any' helps us bypass strict TypeScript rules
        const data = event.data as any;
        const sender = data.senderName;
        const targetX = data.senderX;
        const targetY = data.senderY;

        // This creates a notification banner at the bottom of the receiver's screen
        const waveNotification = WA.ui.displayActionMessage({
            message: `${sender} is waving at you! Click here to join them.`,
            callback: async () => {
                // If they click the banner, they walk to the sender
                WA.chat.sendChatMessage(`Walking to ${sender}...`);
                WA.player.moveTo(targetX, targetY);
            },
            type: "success"
        });

        // This removes the notification after 15 seconds so it doesn't stay forever
        setTimeout(() => {
            waveNotification.remove();
        }, 15000);
    });

    // Bootstraps the Extra library
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

// Helper function to close the clock popup
function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};