import { redirect } from "next/navigation";

export default function AdminLocaleRedirect({
  params,
}: {
  params: { slug?: string[] };
}) {
  const path = params.slug?.length ? `/${params.slug.join("/")}` : "";
  redirect(`/admin${path}`);
}
