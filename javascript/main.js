require("dotenv").config({ path: "./config.env" });

const nightmare = require("nightmare");
const scraper = nightmare();

const sendgridMail = require("@sendgrid/mail");
sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

const args = process.argv.slice(2);
const [url, minPrice] = args;

async function sendEmail(subject, body) {
  const email = {
    to: process.env.SENDGRID_EMAIL,
    from: "amazon-price-checker@example.com",
    subject,
    text: body,
    html: body,
  };
  return sendgridMail(email);
}

async function checkPrice() {
  try {
    const price = await scraper
      .goto(url)
      .wait("#corePrice_desktop > div > table > tbody > tr > td.a-span12 > span.a-price.a-text-price.a-size-medium.apexPriceToPay > span.a-offscreen")
      .evaluate(() => document.getElementsByClassName("#corePrice_desktop > div > table > tbody > tr > td.a-span12 > span.a-price.a-text-price.a-size-medium.apexPriceToPay > span.a-offscreen").innerText)
      .end();
    const finalPrice = parseFloat(price.replace("$", ""));
    if (finalPrice < minPrice) await sendEmail("Price is low!",`The price on ${url} has dropped below ${price}`);
  } catch (error) {
      await sendEmail("Amazon Price Checker Error", error.message);
      throw error;
  };
}

checkPrice();