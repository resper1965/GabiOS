import { redirect } from "react-router";

export function loader() {
  return redirect("/dashboard/agents");
}

export default function DashboardIndex() {
  return null;
}
