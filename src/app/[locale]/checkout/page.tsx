"use client";
import { useCart } from "@/store/cartStore";

export default function CheckoutPage() {
  const cart = useCart();
  
  return (
    <div>
      <h1>Checkout</h1>
    </div>
  );
}