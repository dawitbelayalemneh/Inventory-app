"use client"

import { useState, useEffect } from "react"
import { addDoc, collection, query, where, getDocs, updateDoc, setDoc, doc } from "firebase/firestore"
import { Firestore } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const db: Firestore = require("../lib/firebase").db;

export function AddStockItem() {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [type, setType] = useState("")
  const [price, setPrice] = useState("")
  const [newType, setNewType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [itemTypes, setItemTypes] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [notifyThreshold, setNotifyThreshold] = useState("")

  useEffect(() => {
    fetchItemTypes()
  }, [])

  const fetchItemTypes = async () => {
    try {
      const typesDoc = await getDocs(collection(db, "itemTypes"))
      const types = typesDoc.docs.map((doc) => doc.id)
      setItemTypes(types)
    } catch (error) {
      console.error("Error fetching item types:", error)
      toast({
        title: "Error",
        description: "Failed to fetch item types. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && quantity && type && price) {
      setIsLoading(true)
      try {
        const q = query(collection(db, "stock"), where("name", "==", name))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          // Item with the same name exists, update quantity
          const existingItem = querySnapshot.docs[0]
          const currentQuantity = existingItem.data().quantity
          await updateDoc(existingItem.ref, {
            quantity: currentQuantity + Number.parseInt(quantity, 10),
            type,
            price: Number.parseFloat(price),
          })
          toast({
            title: "Success",
            description: "Stock item updated successfully!",
          })
        } else {
          // Add new item
          await addDoc(collection(db, "stock"), {
            name,
            quantity: Number.parseInt(quantity, 10),
            type,
            price: Number.parseFloat(price),
          })
          toast({
            title: "Success",
            description: "New stock item added successfully!",
          })
        }

        setName("")
        setQuantity("")
        setType("")
        setPrice("")
        setIsOpen(false)
      } catch (error) {
        console.error("Error adding/updating stock item: ", error)
        toast({
          title: "Error",
          description: "Failed to add/update stock item. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAddNewType = async () => {
    if (newType) {
      try {
        await setDoc(doc(db, "itemTypes", newType), { name: newType })
        toast({
          title: "Success",
          description: "New item type added successfully!",
        })
        setNewType("")
        fetchItemTypes()
      } catch (error) {
        console.error("Error adding new item type:", error)
        toast({
          title: "Error",
          description: "Failed to add new item type. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Stock Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add New Stock Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="type">Item Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((itemType) => (
                  <SelectItem key={itemType} value={itemType} className="flex justify-between items-center">
                    <span>{itemType}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="newType">Add New Item Type</Label>
            <div className="flex space-x-2">
              <Input
                id="newType"
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="New item type"
              />
              <Button type="button" onClick={handleAddNewType}>
                Add Type
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="price">Price (ETB)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="notifyThreshold">Notify me when stock is below</Label>
            <Input
              id="notifyThreshold"
              type="number"
              value={notifyThreshold}
              onChange={(e) => setNotifyThreshold(e.target.value)}
              placeholder="Enter threshold"
              min="0"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Stock Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

