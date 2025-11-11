import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  materialType: string;
  size: string;
  quantity: number;
  embroideryRequired: boolean;
  notes?: string;
  assignedCutter: string | null;
  assignedTailor: string | null;
  assignedFinisher: string | null;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface User {
  id: string;
  name: string;
  role: string;
  uid?: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const getUserName = (uid: string | null | undefined): string => {
    if (!uid) return "Unassigned";
    const user = users.find((u) => u.id === uid || u.uid === uid);
    return user?.name || uid;
  };

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.toMillis()).toLocaleString();
  };

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Partial<Order>;
        return {
          id: docSnap.id,
          orderId: data.orderId || "",
          customerName: data.customerName || "",
          materialType: data.materialType || "",
          size: data.size || "",
          quantity: data.quantity || 0,
          embroideryRequired: data.embroideryRequired ?? false,
          notes: data.notes || "",
          assignedCutter: data.assignedCutter || null,
          assignedTailor: data.assignedTailor || null,
          assignedFinisher: data.assignedFinisher || null,
          status: (data.status as OrderStatus) || "cutting",
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt,
        } as Order;
      });
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as User[];
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditDialogOpen(true);
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      toast({ title: "Success", description: "Order updated successfully" });
      setEditDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const [editFormData, setEditFormData] = useState<{
    assignedCutter: string;
    assignedTailor: string;
    assignedFinisher: string;
    status: OrderStatus;
  }>({
    assignedCutter: "none",
    assignedTailor: "none",
    assignedFinisher: "none",
    status: "cutting",
  });

  useEffect(() => {
    if (editingOrder) {
      setEditFormData({
        assignedCutter: editingOrder.assignedCutter || "none",
        assignedTailor: editingOrder.assignedTailor || "none",
        assignedFinisher: editingOrder.assignedFinisher || "none",
        status: editingOrder.status || "cutting",
      });
    }
  }, [editingOrder]);

  const getUsersByRole = (role: string) => users.filter((u) => u.role === role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          View all orders and manage production workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Complete order details and workflow tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                  <TableHead>Cutter</TableHead>
                  <TableHead>Tailor</TableHead>
                  <TableHead>Finisher</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
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
                    <TableCell className="text-sm">
                      {getUserName(order.assignedCutter)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getUserName(order.assignedTailor)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.embroideryRequired
                        ? getUserName(order.assignedFinisher)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(order.updatedAt || order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Order: {editingOrder.orderId}</DialogTitle>
                <DialogDescription>
                  Update order assignments and status
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <p className="text-sm font-medium">
                      {editingOrder.customerName}
                    </p>
                  </div>
                  <div>
                    <Label>Material Type</Label>
                    <p className="text-sm font-medium">
                      {editingOrder.materialType}
                    </p>
                  </div>
                  <div>
                    <Label>Size</Label>
                    <p className="text-sm font-medium">{editingOrder.size}</p>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <p className="text-sm font-medium">{editingOrder.quantity}</p>
                  </div>
                  <div>
                    <Label>Embroidery Required</Label>
                    <p className="text-sm font-medium">
                      {editingOrder.embroideryRequired ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
                          status: value as OrderStatus,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cutting">Cutting</SelectItem>
                        <SelectItem value="ready-for-tailoring">
                          Ready for Tailoring
                        </SelectItem>
                        <SelectItem value="in-stitching">
                          In Stitching
                        </SelectItem>
                        <SelectItem value="ready-for-finishing">
                          Ready for Finishing
                        </SelectItem>
                        <SelectItem value="ready-for-delivery">
                          Ready for Delivery
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Cutter */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-cutter">Assign Cutter</Label>
                      <Select
                        value={editFormData.assignedCutter}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            assignedCutter: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {getUsersByRole("cutter").map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tailor */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-tailor">Assign Tailor</Label>
                      <Select
                        value={editFormData.assignedTailor}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            assignedTailor: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {getUsersByRole("tailor").map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Finisher (only if embroidery) */}
                    {editingOrder.embroideryRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-finisher">Assign Finisher</Label>
                        <Select
                          value={editFormData.assignedFinisher}
                          onValueChange={(value) =>
                            setEditFormData({
                              ...editFormData,
                              assignedFinisher: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {getUsersByRole("finisher").map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editingOrder) return;
                    handleUpdateOrder(editingOrder.id, {
                      status: editFormData.status || "cutting",
                      assignedCutter:
                        editFormData.assignedCutter === "none"
                          ? null
                          : editFormData.assignedCutter,
                      assignedTailor:
                        editFormData.assignedTailor === "none"
                          ? null
                          : editFormData.assignedTailor,
                      assignedFinisher: editingOrder.embroideryRequired
                        ? editFormData.assignedFinisher === "none"
                          ? null
                          : editFormData.assignedFinisher
                        : null,
                    });
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
