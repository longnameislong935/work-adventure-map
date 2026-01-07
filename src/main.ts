/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

WA.onInit().then(() => {
    console.log('Scripting API ready');

    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    });

    WA.room.area.onLeave('clock').subscribe(closePopup);

    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');

        // This @ts-ignore prevents the TS18046 error by skipping type checking for the next line
        // @ts-ignore
        const bellVar = WA.state.getVariable('bell');
        console.log("DEBUG: Current value of 'bell' variable:", bellVar);

        if (bellVar === undefined) {
            console.warn("WARNING: The 'bell' variable was not found in the map. Check Tiled Point Object properties.");
        }

        WA.state.onVariableChange('bell').subscribe((value) => {
            console.log('EVENT: Bell variable changed to:', value);

            if (value === true) {
                currentPopup = WA.ui.openPopup("bellMessage", "Ding Dong! Someone is at the door.", [
                    {
                        label: "Close",
                        className: "success",
                        callback: (popup: any) => {
                            popup.close();
                            currentPopup = undefined;
                        }
                    }
                ]);

                setTimeout(() => {
                    console.log('Resetting bell variable...');
                    WA.state.saveVariable('bell', false);
                }, 3000);
            }
        });

    }).catch(e => console.error('Error bootstrapping Extra:', e));

}).catch(e => console.error('WA.onInit Error:', e));

function closePopup() {
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};