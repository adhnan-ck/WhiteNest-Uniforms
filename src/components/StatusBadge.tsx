import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "cutting" | "ready-for-tailoring" | "in-stitching" | "ready-for-finishing" | "ready-for-delivery";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig = {
  cutting: {
    label: "Cutting",
    className: "bg-status-cutting/10 text-status-cutting border-status-cutting/20",
  },
  "ready-for-tailoring": {
    label: "Ready for Tailoring",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  "in-stitching": {
    label: "In Stitching",
    className: "bg-status-stitching/10 text-status-stitching border-status-stitching/20",
  },
  "ready-for-finishing": {
    label: "Ready for Finishing",
    className: "bg-status-finishing/10 text-status-finishing border-status-finishing/20",
  },
  "ready-for-delivery": {
    label: "Ready for Delivery",
    className: "bg-status-delivery/10 text-status-delivery border-status-delivery/20",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
