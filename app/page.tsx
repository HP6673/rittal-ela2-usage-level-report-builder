import type { Metadata } from "next";
import { Calculator } from "./Calculator";

export const metadata: Metadata = {
  title: "ELA2 Usage Level Report Builder",
  description:
    "A live report builder based on the General information and Report tabs.",
};

export default function Home() {
  return <Calculator />;
}
