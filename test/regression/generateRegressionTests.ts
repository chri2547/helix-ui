import * as child_process from "child_process";

import {$, By, snap, Snappit, IConfig, WebDriver, WebElement} from "snappit-visual-regression";

import {test, TestContext} from "ava";

import * as util from "../common/util";

const grepCommand = 'grep "\\bdata-visreg=" -r ../docs | grep "index\.html"';
const taggedForRegression = child_process.execSync(grepCommand).toString().trim();

const componentExtractor = new RegExp("(\\w+/[\\w-]+)/index\\.html", "gm");
let matches: string[] = [];
let matched: RegExpExecArray;
while (matched = componentExtractor.exec(taggedForRegression)) {
    const match = matched[1];
    if (matches.indexOf(match) < 0) {
        matches.push(match);
    }
}

const regressionTest = async (t: TestContext, config: IConfig, component: string) => {
    if (process.env.CI) {
        config.serverUrl = `http://${process.env.SAUCE_USERNAME}:${process.env.SAUCE_ACCESS_KEY}@ondemand.saucelabs.com:80/wd/hub`;
        config.sauceLabs.name = component;
        config.sauceLabs.build = process.env.TRAVIS_BUILD_NUMBER;
        config.sauceLabs.tunnelIdentifier = process.env.TRAVIS_BUILD_ID;
    }

    const snappit = new Snappit(config);
    const driver = await snappit.start();
    await util.go(driver, component);

    for (const e of await driver.findElements(By.css(util.selectors.visreg))) {
        const sectionName = await e.getAttribute("data-visreg");
        t.log(`  ${sectionName}:`);
        await util.snapshot(t, e);
        t.log("    ✔ DOM Snapshot");
        await snappit.snap(`{browserName}/${sectionName}`, e as WebElement);
        t.log("    ✔ Image Snapshot");
    }

    await snappit.stop();
}

const config: IConfig = {
    browser: "",
    screenshotsDir: "artifacts/regressionScreenshots",
    logException: [
        "MISMATCH",
        "NO_BASELINE",
        "SIZE_DIFFERENCE",
    ],
    sauceLabs: {
        platform: 'macOS 10.12',
        version: 'latest',
        screenResolution: '1920x1440',
    },
    threshold: 0.1,
    initialViewportSize: [1920, 1440],
};

for (const component of matches.slice(0, 1)) {

    test.skip(`firefox auto-generated regression case: ${component}`, async t => {
        config.browser = "firefox";
        config.sauceLabs.browserName = "firefox";
        await regressionTest(t, config, component);
    });

    test(`chrome auto-generated regression case: ${component}`, async t => {
        config.browser = "chrome";
        config.sauceLabs.browserName = "chrome";
        await regressionTest(t, config, component);
    });

}
