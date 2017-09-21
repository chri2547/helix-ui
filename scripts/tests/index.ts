import {expect} from "chai";

import {$, Snappit, IConfig} from "snappit-visual-regression";

describe('helix', () => {
    let snappit: Snappit;
    let driver: any;

    before(() => {
        const config: IConfig = {
            browser: "chrome",
            screenshotsDir: "screenshots",
            threshold: 0.1,
            useDirect: true,
        };

        snappit = new Snappit(config);
        driver = snappit.start();
    });

    it("should navigate to the localhost page", async () => {
        // Cast here as TypeScript thinks driver might not be initialized.
        driver.get("http://localhost:3000/");

        expect(await $("body").isDisplayed()).to.eql(true);
    });

    it("should terminate the driver instances", async () => {
        await snappit.stop();
    });
});