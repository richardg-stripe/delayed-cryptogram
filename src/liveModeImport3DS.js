const _ = require("lodash");
const moment = require("moment");
const { secretKeyStripe, publishableKeyStripe } = require("./stripe");
const { keypress } = require("./common");

const printResponse = (response) =>
  console.log(JSON.stringify(response, null, 2));

const cardDetails = {
  number: process.env.CARD_NUMBER,
  exp_month: process.env.CARD_EXPIRY_MONTH,
  exp_year: process.env.CARD_EXPIRY_YEAR,
  cvc: process.env.CARD_CVC,
};

(async () => {
  try {
    const setupIntent = await secretKeyStripe.setupIntents.create({
      single_use: {
        amount: 30,
        currency: "gbp",
      },
      payment_method_data: {
        type: "card",
        card: cardDetails,
      },
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
          verify_card_account: "never",
          three_d_secure: {
            gateway: {
              acquirer_bin: process.env.ACQUIRER_BIN,
              merchant_id: process.env.MERCHANT_ID,
              requestor_id: process.env.REQUESTOR_ID,
            },
          },
        },
      },
      confirm: true,
    });
    printResponse(setupIntent);
    await keypress();
    const setupIntent2 = await secretKeyStripe.setupIntents.retrieve(
      setupIntent.id,
      { expand: ["latest_attempt"] }
    );
    const threeDSecure =
      setupIntent2.latest_attempt.payment_method_details.card.three_d_secure;
    printResponse(setupIntent2);
    printResponse(threeDSecure);
    const paymentMethod = await publishableKeyStripe.paymentMethods.create({
      type: "card",
      card: cardDetails,
    });
    printResponse(paymentMethod);

    const customer = await secretKeyStripe.customers.create({
      name: "Fred",
      payment_method: paymentMethod.id,
    });
    await keypress();
    const paymentIntent = await secretKeyStripe.paymentIntents.create({
      amount: 30,
      currency: "gbp",
      customer: customer.id,
      payment_method: paymentMethod.id,
      payment_method_options: {
        card: {
          three_d_secure: _.pick(
            threeDSecure,
            "version",
            "cryptogram",
            "electronic_commerce_indicator",
            "transaction_id"
          ),
        },
      },
      confirm: true,
      setup_future_usage: "off_session",
    });
    printResponse(paymentIntent);

    // Later!

    const laterPaymentIntent = await secretKeyStripe.paymentIntents.create({
      amount: 30,
      currency: "gbp",
      customer: customer.id,
      payment_method: paymentMethod.id,
      confirm: true,
    });
    printResponse(laterPaymentIntent);
  } catch (error) {
    console.error(error);
  }
})();
