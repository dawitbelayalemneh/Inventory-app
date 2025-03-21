"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Trash2, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StockItem {
  id: string
  name: string
  quantity: number
  type: string
  price: number
}

interface Sale {
  id: string
  itemId: string
  itemName: string
  quantity: number
  totalPrice: number
  soldBy: string
  timestamp: Date
  includedInZReport: boolean
}

export function StockList() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [updateQuantity, setUpdateQuantity] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const unsubscribe = onSnapshot(collection(db, "stock"), (snapshot) => {
          const items = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as StockItem,
          )
          items.sort((a, b) => a.name.localeCompare(b.name))
          setStockItems(items)
          setIsLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching stock items: ", error)
        toast({
          title: "Error",
          description: "Failed to fetch stock items. Please refresh the page.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchStockItems()
  }, [])

  const handleUpdateStock = async (id: string, action: "add" | "sell") => {
    const item = stockItems.find((item) => item.id === id)
    if (!item) return

    const updateAmount = Number.parseInt(updateQuantity[id] || "0", 10)
    if (isNaN(updateAmount) || updateAmount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    let newQuantity: number

    if (action === "add") {
      newQuantity = item.quantity + updateAmount
    } else {
      // sell
      newQuantity = item.quantity - updateAmount
      if (newQuantity < 0) {
        toast({
          title: "Invalid Operation",
          description: "Selling quantity exceeds available stock.",
          variant: "destructive",
        })
        return
      }
    }

    try {
      if (newQuantity === 0) {
        await deleteDoc(doc(db, "stock", id))
      } else {
        await updateDoc(doc(db, "stock", id), { quantity: newQuantity })
      }
      setUpdateQuantity((prev) => ({ ...prev, [id]: "" }))

      if (action === "sell") {
        const totalPrice = updateAmount * item.price
        // Record the sale in the sales collection
        const saleDoc = await addDoc(collection(db, "sales"), {
          itemId: id,
          itemName: item.name,
          quantity: updateAmount,
          totalPrice,
          soldBy: "admin",
          timestamp: new Date(),
          includedInZReport: false, // Explicitly set this field to false
        })
        console.log("Sale recorded with ID:", saleDoc.id)
        toast({
          title: "Sale Successful",
          description: `Sold ${updateAmount} ${item.name}(s) for a total of ETB ${totalPrice.toFixed(2)}`,
        })
      } else {
        toast({
          title: "Success",
          description: `Stock increased successfully.`,
        })
      }
    } catch (error) {
      console.error("Error updating stock: ", error)
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "stock", id))
        toast({
          title: "Success",
          description: "Stock item deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting stock item: ", error)
        toast({
          title: "Error",
          description: "Failed to delete stock item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return <div>Loading stock items...</div>
  }

  const filteredItems = stockItems
    .filter((item) => activeTab === "all" || item.type === activeTab)
    .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          {Array.from(new Set(stockItems.map((item) => item.type))).map((type) => (
            <TabsTrigger key={type} value={type}>
              {type}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-4">No items found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price (ETB)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className={item.quantity < 5 ? "bg-red-100" : ""}>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.quantity < 5 && <AlertTriangle className="inline-block ml-2 h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>ETB {item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={updateQuantity[item.id] || ""}
                          onChange={(e) => setUpdateQuantity((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Quantity"
                          className="w-24"
                        />
                        <Button onClick={() => handleUpdateStock(item.id, "add")}>Add</Button>
                        <Button onClick={() => handleUpdateStock(item.id, "sell")}>Sell</Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

