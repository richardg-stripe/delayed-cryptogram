const _ = require("lodash");
const moment = require("moment");
const { secretKeyStripe, publishableKeyStripe } = require("./stripe");

const printResponse = (response) =>
  console.log(JSON.stringify(response, null, 2));

const validCryptogram = {
  version: "2.2.0",
  electronic_commerce_indicator: "05",
  cryptogram: "4BQwsg4yuKt0S1LI1nDZTcO9vUM=",
  transaction_id: "f879ea1c-aa2c-4441-806d-e30406466d79",
};

(async () => {
  try {
    const paymentMethod = await publishableKeyStripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4000002760003184",
        exp_month: 8,
        exp_year: 2025,
        cvc: "314",
      },
    });
    printResponse(paymentMethod);

    const customer = await secretKeyStripe.customers.create({
      name: "Fred",
      payment_method: paymentMethod.id,
    });

    const paymentIntent = await secretKeyStripe.paymentIntents.create({
      amount: 2000,
      currency: "gbp",
      customer: customer.id,
      payment_method: paymentMethod.id,
      payment_method_options: {
        card: {
          three_d_secure: validCryptogram,
        },
      },
      confirm: true,
      setup_future_usage: "off_session",
    });
    printResponse(paymentIntent);

    // Later!

    const laterPaymentIntent = await secretKeyStripe.paymentIntents.create({
      amount: 2000,
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
