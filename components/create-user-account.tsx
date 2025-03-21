"use client"

import { useState } from "react"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CreateUserAccount() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username && password) {
      setIsLoading(true)
      try {
        // Check if the username already exists
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("username", "==", username))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          // Username doesn't exist, create new user
          await addDoc(collection(db, "users"), {
            username,
            password,
            role: "user",
          })
          toast({
            title: "Success",
            description: "New user account created successfully!",
          })
          setUsername("")
          setPassword("")
          setIsOpen(false)
        } else {
          toast({
            title: "Error",
            description: "Username already exists. Please choose a different username.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error creating user account: ", error)
        toast({
          title: "Error",
          description: "Failed to create user account. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

