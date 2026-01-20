import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function Page() {
  // Get the checkout session ID from the URL
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="container">
      <p className="message">Your payment was successful</p>

      <Link to="/" className="button">
        Back to products
      </Link>
    </div>
  );
}