import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  materialType: string;
  size: string;
  quantity: number;
  embroideryRequired: boolean;
  status: OrderStatus;
  assignedTailor: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const TailorPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;

    let readyOrders: Order[] = [];
    let stitchingOrders: Order[] = [];

    const updateCombinedOrders = () => {
      // For ready-for-tailoring: show unassigned or assigned to current tailor
      const readyFiltered = readyOrders.filter(order => 
        order.assignedTailor === null || order.assignedTailor === user.uid
      );
      
      // For in-stitching: only show orders assigned to current tailor
      const stitchingFiltered = stitchingOrders.filter(order => 
        order.assignedTailor === user.uid
      );

      setOrders([...readyFiltered, ...stitchingFiltered]);
    };

    // Query orders with status "Ready for Tailoring"
    const qReady = query(
      collection(db, "orders"),
      where("status", "==", "ready-for-tailoring")
    );

    const unsubscribeReady = onSnapshot(qReady, (snapshot) => {
      readyOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      updateCombinedOrders();
    });

    // Query orders with status "In Stitching"
    const qStitching = query(
      collection(db, "orders"),
      where("status", "==", "in-stitching")
    );

    const unsubscribeStitching = onSnapshot(qStitching, (snapshot) => {
      stitchingOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      updateCombinedOrders();
    });

    return () => {
      unsubscribeReady();
      unsubscribeStitching();
    };
  }, [user]);

  const startStitching = async (orderId: string, order: Order) => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "in-stitching" as OrderStatus,
        assignedTailor: user.uid,
        updatedAt: Timestamp.now(),
        "timestamps.inStitching": Timestamp.now(),
      });

      toast({
        title: "Success",
        description: "Order marked as in stitching",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus, order: Order) => {
    if (!user?.uid) return;

    try {
      // Auto-assign if not already assigned
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      // If order is not assigned, assign it to current tailor
      if (!order.assignedTailor) {
        updateData.assignedTailor = user.uid;
      }

      // Set appropriate timestamp
      if (newStatus === "ready-for-finishing") {
        updateData["timestamps.readyForFinishing"] = Timestamp.now();
      } else if (newStatus === "ready-for-delivery") {
        updateData["timestamps.readyForDelivery"] = Timestamp.now();
      }

      await updateDoc(doc(db, "orders", orderId), updateData);

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (orderId: string, order: Order, statusValue: string) => {
    if (!user?.uid) return;

    // Apply embroidery logic
    let newStatus: OrderStatus;
    if (statusValue === "complete") {
      // If embroidery required → "Ready for Finishing", else → "Ready for Delivery"
      newStatus = order.embroideryRequired ? "ready-for-finishing" : "ready-for-delivery";
    } else if (statusValue === "in-stitching") {
      newStatus = "in-stitching";
      await startStitching(orderId, order);
      return;
    } else {
      newStatus = statusValue as OrderStatus;
    }

    await updateStatus(orderId, newStatus, order);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tailor Panel</h1>
        <p className="text-muted-foreground">Manage tailoring tasks and update order progress</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Ready for Tailoring</CardTitle>
          <CardDescription>
            {orders.some(o => o.assignedTailor === null) 
              ? "Unassigned orders are visible to all tailors. Start work to claim an order." 
              : "Orders assigned to you for tailoring"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders available for tailoring</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Embroidery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell>{order.materialType}</TableCell>
                    <TableCell>{order.size}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      {order.embroideryRequired ? (
                        <span className="text-sm text-blue-600">Yes</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {order.status === "ready-for-tailoring" ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-2"
                          onClick={() => handleStatusChange(order.id, order, "in-stitching")}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start Stitching
                        </Button>
                      ) : order.status === "in-stitching" ? (
                        <Select
                          value=""
                          onValueChange={(value) => handleStatusChange(order.id, order, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete">
                              {order.embroideryRequired ? "Ready for Finishing" : "Ready for Delivery"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TailorPanel;
