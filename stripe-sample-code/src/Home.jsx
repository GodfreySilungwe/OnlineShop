import React, { useState } from "react";

const products = [
  {
    name: "Beverage",
    priceId: "price_1SriwqCZASIgPTZBb9RLjlCL",
    price: "$25.00",
    image: "https://i.imgur.com/6Mvijcm.png",
  },
];

const Product = ({ name, price, priceId, period, image }) => {

  return (
    <div className="product round-border">
      <div className="product-info">
        <img src={image} alt={name} />
        <div className="description">
          <h3>{name}</h3>
          <h5>{price} {period && `/ ${period}`}</h5>
        </div>
      </div>

      <form action="/api/create-checkout-session" method="POST">
        <input type="hidden" name="priceId" value={priceId} />
        <button className="button" type="submit">
          Checkout
        </button>
      </form>
    </div>
  );
};

export default function Page() {

  return (
    <div className="container">
      <div className="logo">Sample Business</div>
      {products.map((product) => (
        <Product key={product.name} {...product} />
      ))}
    </div>
  );
}

