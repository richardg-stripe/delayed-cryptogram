const _ = require("lodash");
const moment = require("moment");
const stripe = require("./stripe");
const {
  successfulAccount,
  idFailsAccount,
  addressFailsAccount,
  germanExternalAccount,
  minorAccount
} = require("./exampleAccounts");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise(resolve =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

const createAccount = async createObject => {
  console.log("creating account");
  const account = await stripe.accounts.create(createObject);
  console.log("press any key to continue with account update");
  await keypress();
  return account;
};

(async () => {
  try {
    const account = await createAccount(addressFailsAccount);
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://example.com/reauth",
      return_url: "https://example.com/return",
      type: "custom_account_update"
    });
    console.log(accountLink)
    await keypress();
    await stripe.charges.create({
      amount: 251000,
      currency: "eur",
      transfer_data: {
        destination: account.id
      },
      source: "tok_visa_triggerNextRequirements"
    });
    await keypress();
    await stripe.charges.create({
      amount: 251000,
      currency: "eur",
      transfer_data: {
        destination: account.id
      },
      source: "tok_visa_triggerNextRequirements"
    });
  } catch (error) {
    console.error(error);
  }
})();
