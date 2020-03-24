/* eslint-disable no-process-env */
import NightwatchBrowser from "nightwatch";

import selectors from "../../assets/common/selectors";
import constants from "../../assets/common/constants";

module.exports = {
    "It Can Access Account with Mnemonic Phrase"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .url(`${process.env.VUE_DEV_SERVER_URL}`)
            .waitForElementVisible(".home-tile-button", 5000)
            .click(".home-tile-button[href='/access-my-account']")
            .waitForElementVisible(".account-tile-button", 5000)
            .click(selectors.softwareAccessSelector)
            .waitForElementVisible("label[for=phrase]", 5000)
            .click("label[for=phrase]")
            .click(".modal-access-by-software > button:nth-child(3)")
            .waitForElementVisible(
                ".modal-mnemonic-phrase > .modal-background > .modal",
                5000
            )
            .waitForElementVisible(
                ".modal-mnemonic-phrase > .modal-background > .modal .list-item",
                5000
            )
            .setValue(
                ".modal-mnemonic-phrase > .modal-background > .modal .list-item > .word",
                `${constants.mnemonicPhrase}\n`
            )
            .waitForElementVisible(selectors.accountInputSelector, 5000)
            .setValue(selectors.accountInputSelector, constants.mnemonicPhraseAccountId)
            .pause(500)
            .click("div.buttons > button:nth-child(2)")
            .waitForElementVisible(".interface-form", 10000)
            .assert.urlContains("interface/send-transfer")
            .assert.containsText(".account .subtitle", constants.mnemonicPhraseAccountId);
    },

    "It Can View Balance"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser.waitForElementVisible(selectors.hbarBalanceSelector, 10000);
        browser.expect.element(selectors.hbarBalanceSelector).text.to.match(constants.regexHBar);
        browser.waitForElementVisible(selectors.usdBalanceSelector, 10000);
        browser.expect.element(selectors.usdBalanceSelector).text.to.match(constants.regexUSD);
    },

    "It Can View Account ID"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .click(".qr-icon > path:nth-child(1)")
            .waitForElementVisible(".pub-qr > canvas:nth-child(1)", 5000)
            .assert.containsText(".account-id .value", constants.mnemonicPhraseAccountId)
            .moveTo(selectors.modalBackgroundSelector, 0, 0)
            .mouseButtonDown("left")
            .mouseButtonUp("left");
    },

    "It Can View Public Key"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .pause(500)
            .click(".key-icon > path:nth-child(1)")
            .waitForElementVisible(".modal-view-keys", 5000)
            .expect.element(selectors.publicKeySelector)
            .text.to.equal(constants.truncatePublic(constants.mnemonicPhrasePublicKey));
        browser
            .moveTo(selectors.modalBackgroundSelector, 0, 0)
            .mouseButtonDown("left")
            .mouseButtonUp("left");
    },

    "It Can View Private Key"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .pause(500)
            .click(".key-icon > path:nth-child(1)")
            .waitForElementVisible(".modal-view-keys", 5000)
            .pause(500)
            .expect.element(selectors.privateKeySelector)
            .text.to.equal(constants.truncatePrivate(constants.mnemonicPhrasePrivateKey));
        browser.expect
            .element(selectors.privateKeySelector)
            .to.have.attribute("class")
            .which.contains("obscure");
        browser.click(selectors.privateKeyObscureSelector);
        browser.expect
            .element(selectors.privateKeySelector)
            .to.have.attribute("class")
            .which.not.contains("obscure");
        browser
            .moveTo(selectors.modalBackgroundSelector, 0, 0)
            .mouseButtonDown("left")
            .mouseButtonUp("left");
    },

    "It Can Download Keystore"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .pause(500)
            .click(".export-keystore-icon > path:nth-child(1)")
            .waitForElementVisible(selectors.passwordSelector, 5000)
            .setValue(selectors.passwordSelector, constants.keystorePassword)
            .waitForElementVisible(selectors.passwordConfirmSelector, 5000)
            .setValue(selectors.passwordConfirmSelector, constants.keystorePassword)
            .pause(1000)
            .click(selectors.modalExportByKeystoreSubmitSelector)
            .waitForElementVisible(selectors.modalExportKeystoreSubmitSelector, 5000)
            .click(selectors.modalExportKeystoreSubmitSelector)
            .waitForElementNotPresent("modal-export-keystore", 5000);
    },

    "It Can See Log Out"(browser: NightwatchBrowser.NightwatchBrowser): void {
        browser
            .pause(500)
            .click("div.links:nth-child(3) > a:nth-child(1)")
            .waitForElementVisible(".modal-background", 5000)
            .assert.visible(".modal-forgot-to-logout");
        browser.end();
    }
};
