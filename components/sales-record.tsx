"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, type Timestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Sale {
  id: string
  itemName: string
  quantity: number
  totalPrice: number
  soldBy: string
  timestamp: Date
}

interface GroupedSales {
  [date: string]: Sale[]
}

export function SalesRecord() {
  const [sales, setSales] = useState<GroupedSales>({})
  const [totalSales, setTotalSales] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const salesRef = collection(db, "sales")
    const q = query(salesRef, orderBy("timestamp", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const salesData: Sale[] = []
        let total = 0

        querySnapshot.forEach((doc) => {
          const saleData = doc.data() as Omit<Sale, "id" | "timestamp"> & { timestamp: Timestamp | null }
          const sale: Sale = {
            id: doc.id,
            ...saleData,
            timestamp: saleData.timestamp ? saleData.timestamp.toDate() : new Date(),
          }
          salesData.push(sale)
          total += sale.totalPrice
        })

        // Group sales by date
        const grouped = salesData.reduce((acc: GroupedSales, sale) => {
          const date = sale.timestamp.toLocaleDateString()
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push(sale)
          return acc
        }, {})

        setSales(grouped)
        setTotalSales(total)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching sales record:", error)
        toast({
          title: "Error",
          description: "Failed to fetch sales record. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const toggleDateExpansion = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }))
  }

  const calculateDailyTotal = (dailySales: Sale[]) => {
    return dailySales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Sales Record</span>
          <Button onClick={toggleVisibility} disabled={isLoading}>
            {isLoading ? "Loading..." : isVisible ? "Hide Sales Records" : "Show Sales Records"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isVisible && (
          <>
            {isLoading ? (
              <p>Loading sales records...</p>
            ) : Object.keys(sales).length === 0 ? (
              <p>No sales records available.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(sales).map(([date, dailySales]) => (
                  <div key={date} className="border rounded-lg p-4">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleDateExpansion(date)}
                    >
                      <h3 className="text-lg font-semibold">{date}</h3>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          Daily Total: ETB {calculateDailyTotal(dailySales).toFixed(2)}
                        </span>
                        {expandedDates[date] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                    {expandedDates[date] && (
                      <Table className="mt-4">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Total Price</TableHead>
                            <TableHead>Sold By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailySales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell>{sale.timestamp.toLocaleTimeString()}</TableCell>
                              <TableCell>{sale.itemName}</TableCell>
                              <TableCell>{sale.quantity}</TableCell>
                              <TableCell>ETB {sale.totalPrice.toFixed(2)}</TableCell>
                              <TableCell>{sale.soldBy}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                ))}
                <div className="mt-4 font-bold text-right">Total Sales: ETB {totalSales.toFixed(2)}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

