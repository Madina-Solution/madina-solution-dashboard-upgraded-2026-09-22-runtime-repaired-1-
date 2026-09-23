import { Metadata } from "next";
import { CartPageContent } from "./cart-content";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Keranjang",
  description: "Keranjang belanja Anda di Madina Solution.",
};

export default function CartPage() {
  return <CartPageContent />;
}
