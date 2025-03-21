"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  username: string
  role: string
}

export function ManageUsers() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users")
      const querySnapshot = await getDocs(usersRef)
      const fetchedUsers = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as User)
        .filter((user) => user.role !== "admin") // Exclude admin users from the list
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId))
        toast({
          title: "Success",
          description: "User deleted successfully.",
        })
        fetchUsers() // Refresh the user list
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

