import { redirect } from "react-router";

export function loader() {
  return redirect("/dashboard/tasks");
}

export default function DashboardIndex() {
  return null;
}
