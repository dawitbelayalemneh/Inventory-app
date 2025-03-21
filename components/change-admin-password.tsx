"use client"

import type React from "react"

import { useState } from "react"
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ChangeAdminPassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Find admin user by username and role
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", "admin"), where("role", "==", "admin"))
      const querySnapshot = await getDocs(q)

      let adminDocRef
      let adminData

      if (querySnapshot.empty) {
        // Create admin user if it doesn't exist
        adminData = {
          username: "admin",
          password: "adminpass",
          role: "admin",
        }
        // Use setDoc with a specific document ID for admin
        adminDocRef = doc(db, "users", "admin")
        await setDoc(adminDocRef, adminData)
      } else {
        adminDocRef = doc(db, "users", querySnapshot.docs[0].id)
        adminData = querySnapshot.docs[0].data()
      }

      // Verify current password
      if (adminData && adminData.password !== currentPassword) {
        throw new Error("Current password is incorrect")
      }

      // Update password while preserving the admin role
      await updateDoc(adminDocRef, {
        password: newPassword,
        role: "admin", // Ensure role remains admin
      })

      toast({
        title: "Success",
        description: "Admin password updated successfully.",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating admin password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Change Admin Password</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Admin Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

