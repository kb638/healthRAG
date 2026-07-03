import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

type ApiStatusProps = {
  status: "checking" | "online" | "offline";
  message?: string;
  serviceName?: string;
  sourceCount?: number;
};

export function ApiStatus({ status, message, serviceName, sourceCount }: ApiStatusProps) {
  const Icon =
    status === "online" ? CheckCircle2 : status === "offline" ? AlertCircle : Activity;
  const label =
    status === "online" ? "API online" : status === "offline" ? "API offline" : "Checking API";
  const detail =
    status === "online"
      ? `${sourceCount ?? 0} indexed sources`
      : status === "offline"
        ? (message ?? "Backend unavailable")
        : "Connecting to backend";

  return (
    <div className={`api-status api-status--${status}`} aria-live="polite">
      <Icon aria-hidden="true" size={18} />
      <div>
        <strong>{label}</strong>
        <span>{serviceName ?? detail}</span>
      </div>
    </div>
  );
}
