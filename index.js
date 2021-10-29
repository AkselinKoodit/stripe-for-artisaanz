const cors = require("cors");
const dotenv = require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const app = express();

//getting data from cart
const getData = async () => {
  console.log("entered getData...");
  let cartData = await axios.get("https://artisaanz.herokuapp.com/cart/all");
  console.log(cartData.data.length);
  const items = cartData.data;
  console.log(items);
};

//middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// app.use(cors());

// app.options("*", cors());

//routes
app.get("/", (req, res) => {
  res.send("It's alive!! Let's get see that cart data: " + getData());
});

app.post("/maksu", (req, res) => {
  const { tavara, token } = req.body;
  console.log("PRODUCT", tavara.name);
  console.log("PRICE", tavara.price);
  const idempotencyKey = uuidv4();

  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then((customer) => {
      stripe.charges
        .create(
          {
            amount: tavara.price * 100,
            currency: "eur",
            customer: customer.id,
            receipt_email: token.email,
            description: `Purchase of ${tavara.name}`,
            shipping: {
              name: token.card.name,
              address: {
                country: token.card.address_country,
              },
            },
            success_url: `http://localhost:3000/kotisivu/kotisivu`,
            cancel_url: `http://localhost:3000/kotisivu/tuotteet`,
          },
          { idempotencyKey }
        )
        .then((result) => res.status(200).json(result))
        .catch((err) => console.log(err));
    });
});

//listen
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server started at " + port));
