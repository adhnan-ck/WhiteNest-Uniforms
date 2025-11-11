import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface FinishingTasks {
  embroideryDone?: boolean;
  buttonsAttached?: boolean;
  packingDone?: boolean;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  materialType: string;
  size: string;
  quantity: number;
  embroideryRequired: boolean;
  status: OrderStatus;
  assignedFinisher: string | null;
  finishingTasks?: FinishingTasks;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const FinisherPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;

    // Query orders with status "Ready for Finishing"
    const q = query(
      collection(db, "orders"),
      where("status", "==", "ready-for-finishing")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Show unassigned orders or orders assigned to current finisher
      const ordersData = allOrders.filter(order => 
        order.assignedFinisher === null || order.assignedFinisher === user.uid
      );
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [user]);

  const updateFinishingTask = async (orderId: string, task: keyof FinishingTasks, value: boolean, order: Order) => {
    if (!user?.uid) return;

    try {
      const currentTasks = order.finishingTasks || {};
      const updatedTasks = {
        ...currentTasks,
        [task]: value,
      };

      // Check if all tasks are complete
      const allTasksComplete = 
        (!order.embroideryRequired || updatedTasks.embroideryDone) &&
        updatedTasks.buttonsAttached &&
        updatedTasks.packingDone;

      const updateData: any = {
        finishingTasks: updatedTasks,
        updatedAt: Timestamp.now(),
      };

      // Auto-assign if not already assigned
      if (!order.assignedFinisher) {
        updateData.assignedFinisher = user.uid;
      }

      // If all tasks are complete, mark as ready for delivery
      if (allTasksComplete) {
        updateData.status = "ready-for-delivery" as OrderStatus;
        updateData["timestamps.readyForDelivery"] = Timestamp.now();
      }

      await updateDoc(doc(db, "orders", orderId), updateData);

      toast({
        title: "Success",
        description: allTasksComplete 
          ? "All tasks complete! Order marked ready for delivery" 
          : "Task updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const getCompletedTasksCount = (order: Order): number => {
    const tasks = order.finishingTasks || {};
    let count = 0;
    if (order.embroideryRequired && tasks.embroideryDone) count++;
    if (tasks.buttonsAttached) count++;
    if (tasks.packingDone) count++;
    return count;
  };

  const getTotalTasksCount = (order: Order): number => {
    return (order.embroideryRequired ? 1 : 0) + 2; // embroidery (if needed) + buttons + packing
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finishing Panel</h1>
        <p className="text-muted-foreground">Complete finishing tasks and mark items ready for delivery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Ready for Finishing</CardTitle>
          <CardDescription>
            {orders.some(o => o.assignedFinisher === null) 
              ? "Unassigned orders are visible to all finishers. Update an order to claim it." 
              : "Orders assigned to you for finishing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders available for finishing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const tasks = order.finishingTasks || {};
                const completedCount = getCompletedTasksCount(order);
                const totalCount = getTotalTasksCount(order);
                const allComplete = completedCount === totalCount;

                return (
                  <Card key={order.id} className={allComplete ? "border-green-200 bg-green-50/50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{order.orderId}</CardTitle>
                          <CardDescription>
                            {order.customerName} • {order.materialType} • Size: {order.size} • Qty: {order.quantity}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status} />
                          {allComplete && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Ready for Delivery
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Finishing Tasks ({completedCount}/{totalCount} complete)
                        </div>
                        <div className="space-y-2">
                          {order.embroideryRequired && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`embroidery-${order.id}`}
                                checked={tasks.embroideryDone || false}
                                onCheckedChange={(checked) => 
                                  updateFinishingTask(order.id, "embroideryDone", checked === true, order)
                                }
                              />
                              <Label htmlFor={`embroidery-${order.id}`} className="cursor-pointer font-normal">
                                Embroidery Done
                              </Label>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`buttons-${order.id}`}
                              checked={tasks.buttonsAttached || false}
                              onCheckedChange={(checked) => 
                                updateFinishingTask(order.id, "buttonsAttached", checked === true, order)
                              }
                            />
                            <Label htmlFor={`buttons-${order.id}`} className="cursor-pointer font-normal">
                              Buttons Attached
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`packing-${order.id}`}
                              checked={tasks.packingDone || false}
                              onCheckedChange={(checked) => 
                                updateFinishingTask(order.id, "packingDone", checked === true, order)
                              }
                            />
                            <Label htmlFor={`packing-${order.id}`} className="cursor-pointer font-normal">
                              Packing Done
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinisherPanel;
