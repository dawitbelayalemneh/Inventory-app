"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore"
import { Firestore } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StockItem {
  id: string
  name: string
  quantity: number
  type: string
  price: number
  notifyThreshold?: number
}

const db: Firestore = require("../lib/firebase").db;

export function UserStockList() {
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

  const handleSell = async (id: string) => {
    const item = stockItems.find((item) => item.id === id)
    if (!item) return

    const sellAmount = Number.parseInt(updateQuantity[id] || "0", 10)
    if (isNaN(sellAmount) || sellAmount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    const newQuantity = item.quantity - sellAmount
    if (newQuantity < 0) {
      toast({
        title: "Invalid Operation",
        description: "Selling quantity exceeds available stock.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateDoc(doc(db, "stock", id), { quantity: newQuantity })
      setUpdateQuantity((prev) => ({ ...prev, [id]: "" }))

      const totalPrice = sellAmount * item.price
      const username = localStorage.getItem("username") || "Unknown"

      // Record the sale in the sales collection
      await addDoc(collection(db, "sales"), {
        itemId: id,
        itemName: item.name,
        quantity: sellAmount,
        totalPrice,
        soldBy: username,
        timestamp: new Date(),
        includedInZReport: false, // Explicitly set this field to false
      })

      toast({
        title: "Sale Successful",
        description: `Sold ${sellAmount} ${item.name}(s) for a total of ETB ${totalPrice.toFixed(2)}`,
      })
    } catch (error) {
      console.error("Error updating stock: ", error)
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading stock items...</div>
  }

  if (stockItems.length === 0) {
    return <div>No stock items available.</div>
  }

  const filteredItems = stockItems
    .filter((item) => activeTab === "all" || item.type === activeTab)
    .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((item) => ({
      ...item,
      isLowStock: item.quantity < (item.notifyThreshold || 5),
    }));

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
          <div className="hidden md:block">
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
                  <TableRow key={item.id} className={item.isLowStock ? "bg-red-100" : ""}>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.isLowStock && <span className="ml-2 text-red-500 text-sm">(Low Stock)</span>}
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
                        <Button onClick={() => handleSell(item.id)}>Sell</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 md:hidden gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="border p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold">{item.name}
                  {item.isLowStock && <span className="ml-2 text-red-500 text-sm">(Low Stock)</span>}
                </h3>
                <p>Type: {item.type}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ETB {item.price.toFixed(2)}</p>
                <Input
                  type="number"
                  value={updateQuantity[item.id] || ""}
                  onChange={(e) => setUpdateQuantity((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Quantity"
                  className="w-full mt-2"
                />
                <div className="flex flex-col space-y-2 mt-4">
                  <Button onClick={() => handleSell(item.id)} className="text-xs md:text-sm">Sell</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

