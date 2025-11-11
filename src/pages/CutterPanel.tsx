import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  materialType: string;
  size: string;
  quantity: number;
  embroideryRequired: boolean;
  notes?: string;
  status: OrderStatus;
  assignedCutter: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const CutterPanel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    materialType: "",
    size: "",
    quantity: "",
    embroideryRequired: false,
    notes: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    // Query all cutting orders, then filter client-side for unassigned or assigned to current user
    const q = query(
      collection(db, "orders"),
      where("status", "==", "cutting")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      const ordersData = allOrders.filter(order => 
        order.assignedCutter === null || order.assignedCutter === user.uid
      );
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const orderId = `ORD-${Date.now()}`;
      await addDoc(collection(db, "orders"), {
        orderId,
        customerName: formData.customerName,
        materialType: formData.materialType,
        size: formData.size,
        quantity: parseInt(formData.quantity),
        embroideryRequired: formData.embroideryRequired,
        notes: formData.notes || null,
        status: "cutting" as OrderStatus,
        assignedCutter: null,
        assignedTailor: null,
        assignedFinisher: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        timestamps: {
          cutting: Timestamp.now(),
        },
      });

      toast({
        title: "Success",
        description: "Order created successfully",
      });

      setFormData({
        customerName: "",
        materialType: "",
        size: "",
        quantity: "",
        embroideryRequired: false,
        notes: "",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const markReadyForTailoring = async (orderId: string) => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "ready-for-tailoring" as OrderStatus,
        assignedCutter: user.uid,
        updatedAt: Timestamp.now(),
        "timestamps.readyForTailoring": Timestamp.now(),
      });

      toast({
        title: "Success",
        description: "Order marked ready for tailoring",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cutter Panel</h1>
          <p className="text-muted-foreground">Manage cutting tasks and mark items ready for tailoring</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add a new order to the production workflow</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
  <Label htmlFor="materialType">Clothing Type *</Label>
  <Select
    value={formData.materialType}
    onValueChange={(value) => setFormData({ ...formData, materialType: value })}
  >
    <SelectTrigger id="materialType">
      <SelectValue placeholder="Select Clothing Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="shirt">Shirt</SelectItem>
      <SelectItem value="shirt-half-sleeve">Shirt Half Sleeve</SelectItem>
      <SelectItem value="trousers">Trousers</SelectItem>
      <SelectItem value="cargos">Cargos</SelectItem>
      <SelectItem value="scrub-suit">Scrub Suit</SelectItem>
      <SelectItem value="security-shirt">Security Shirt</SelectItem>
      <SelectItem value="suits">Suits</SelectItem>
      <SelectItem value="safety-vest">Safety Vest</SelectItem>
      <SelectItem value="blazer">Blazer</SelectItem>
      <SelectItem value="chef-jacket">Chef Jackets</SelectItem>
      <SelectItem value="jacket">Jackets</SelectItem>
      <SelectItem value="winter-jacket">Winter Jackets</SelectItem>
      <SelectItem value="summer-jacket">Summer Jackets</SelectItem>
      <SelectItem value="apron-short">Apron Short</SelectItem>
      <SelectItem value="apron-long">Apron Long</SelectItem>
      <SelectItem value="cap">Cap</SelectItem>
      <SelectItem value="bandana">Bandana</SelectItem>
      <SelectItem value="tie">Tie</SelectItem>
    </SelectContent>
  </Select>
</div>


                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="embroideryRequired"
                    checked={formData.embroideryRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, embroideryRequired: checked === true })}
                  />
                  <Label htmlFor="embroideryRequired" className="cursor-pointer">
                    Embroidery Required
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this order..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders for Cutting</CardTitle>
          <CardDescription>
            {orders.some(o => o.assignedCutter === null) 
              ? "Unassigned orders are visible to all cutters. Update an order to claim it." 
              : "Orders assigned to you for cutting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders available for cutting</p>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => markReadyForTailoring(order.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Ready for Tailoring
                      </Button>
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

export default CutterPanel;
