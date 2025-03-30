"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  getDocs,
  orderBy,
  addDoc,
  Timestamp,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../lib/firebase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Sale {
  id: string
  itemName: string
  quantity: number
  totalPrice: number
  soldBy: string
  timestamp: Date
  includedInZReport: boolean
}

interface ZReport {
  id: string
  date: Date
  totalSales: number
  generatedBy: string
  sales: Sale[]
}

export function AdminZReport() {
  const [zReports, setZReports] = useState<ZReport[]>([])
  const [totalStoreSales, setTotalStoreSales] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [expandedReports, setExpandedReports] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchZReports()
  }, [])

  const generateZReport = async () => {
    setIsLoading(true)
    try {
      console.log("Starting Z-report generation for admin")

      // Get all sales where includedInZReport is explicitly false or undefined/missing
      const salesRef = collection(db, "sales")
      const querySnapshot = await getDocs(salesRef)

      console.log("Fetched all sales:", querySnapshot.size)

      const salesToInclude: Sale[] = []
      let totalSales = 0

      querySnapshot.forEach((doc) => {
        const saleData = doc.data()
        // Include sales where includedInZReport is false or undefined
        if (saleData.includedInZReport !== true) {
          const sale: Sale = {
            id: doc.id,
            itemName: saleData.itemName,
            quantity: saleData.quantity,
            totalPrice: saleData.totalPrice,
            soldBy: saleData.soldBy,
            timestamp: saleData.timestamp
              ? saleData.timestamp instanceof Timestamp
                ? saleData.timestamp.toDate()
                : new Date(saleData.timestamp)
              : new Date(),
            includedInZReport: false,
          }
          salesToInclude.push(sale)
          totalSales += sale.totalPrice
        }
      })

      console.log("Sales to include in Z-report:", salesToInclude.length)

      if (salesToInclude.length === 0) {
        console.log("No new sales to include in Z-report")
        toast({
          title: "No new sales",
          description: "There are no new sales to include in a Z-report.",
          variant: "warning",
        })
        setIsLoading(false)
        return
      }

      // Save the Z-report to Firestore
      const zReportRef = collection(db, "admin-zreports")
      const newZReportRef = await addDoc(zReportRef, {
        date: serverTimestamp(),
        sales: salesToInclude.map((sale) => ({
          ...sale,
          timestamp: Timestamp.fromDate(sale.timestamp),
        })),
        totalSales: totalSales,
        generatedBy: "admin",
      })

      console.log("Z-report added to Firestore with ID:", newZReportRef.id)

      // Mark included sales as part of a Z-report
      const batch = writeBatch(db)
      salesToInclude.forEach((sale) => {
        const saleRef = doc(db, "sales", sale.id)
        batch.update(saleRef, { includedInZReport: true })
      })
      await batch.commit()

      console.log("Sales marked as included in Z-report")

      toast({
        title: "Success",
        description: `Z-report generated successfully with ${salesToInclude.length} sales.`,
      })

      // Refresh the Z-reports list
      await fetchZReports()
    } catch (error) {
      console.error("Error generating Z-report:", error)
      toast({
        title: "Error",
        description: "Failed to generate Z-report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchZReports = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching Z-reports")
      const zReportsRef = collection(db, "admin-zreports")
      const q = query(zReportsRef, orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      console.log("Fetched Z-reports:", querySnapshot.size)

      const reports: ZReport[] = []
      let total = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<ZReport, "id" | "date"> & { date: Timestamp }
        const report: ZReport = {
          id: doc.id,
          date: data.date.toDate(),
          totalSales: data.totalSales,
          generatedBy: data.generatedBy,
          sales: Array.isArray(data.sales)
            ? data.sales.map((sale: any) => ({
                ...sale,
                timestamp: sale.timestamp instanceof Timestamp ? sale.timestamp.toDate() : new Date(sale.timestamp),
              }))
            : [],
        }
        reports.push(report)
        total += report.totalSales
      })

      console.log("Processed Z-reports:", reports.length)

      setZReports(reports)
      setTotalStoreSales(total)
    } catch (error) {
      console.error("Error fetching Z-reports:", error)
      toast({
        title: "Error",
        description: "Failed to fetch Z-reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Z-Reports</span>
          <div>
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-4">
              <Button onClick={generateZReport} disabled={isLoading} className="text-xs md:text-sm">
                {isLoading ? "Generating..." : "Generate Z-Report"}
              </Button>
              <Button onClick={toggleVisibility} disabled={isLoading} className="text-xs md:text-sm">
                {isLoading ? "Loading..." : isVisible ? "Hide Z-Reports" : "Show Z-Reports"}
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isVisible && (
          <>
            {isLoading && <p>Loading Z-reports...</p>}
            {!isLoading && zReports.length === 0 ? (
              <p>No Z-reports available. Generate your first Z-report to see it here.</p>
            ) : (
              <>
                {isVisible &&
                  zReports.map((report) => (
                    <div key={report.id} className="mb-4 border rounded-lg p-4">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleReportExpansion(report.id)}
                      >
                        <h4 className="text-md font-semibold">
                          Z-Report for {report.date.toLocaleDateString()} at {report.date.toLocaleTimeString()}
                        </h4>
                        <div className="flex items-center gap-4">
                          <span>Total: ETB {report.totalSales.toFixed(2)}</span>
                          {expandedReports[report.id] ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>

                      {expandedReports[report.id] && (
                        <div className="mt-4">
                          <Table>
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
                              {report.sales &&
                                report.sales.map((sale, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {sale.timestamp instanceof Date ? sale.timestamp.toLocaleTimeString() : "N/A"}
                                    </TableCell>
                                    <TableCell>{sale.itemName}</TableCell>
                                    <TableCell>{sale.quantity}</TableCell>
                                    <TableCell>ETB {sale.totalPrice.toFixed(2)}</TableCell>
                                    <TableCell>{sale.soldBy}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                {isVisible && zReports.length > 0 && (
                  <div className="mt-4 font-bold">Total Z-Report Sales: ETB {totalStoreSales.toFixed(2)}</div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

