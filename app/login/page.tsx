"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if the user exists in Firestore
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()

        if (userData.password === password) {
          localStorage.setItem("userRole", userData.role)
          localStorage.setItem("username", username)
          router.push("/")
          toast({
            title: "Login Successful",
            description: `Welcome, ${username}!`,
          })
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid username or password",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking user credentials:", error)
      toast({
        title: "Login Error",
        description: "An error occurred while logging in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  )
}

