import { redirect } from "next/navigation";

/** Legacy URL; data uses `category-context`. */
export default function ProcessContextRedirectPage() {
  redirect("/dashboard/data-sources/category-context");
}
