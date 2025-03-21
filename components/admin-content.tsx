import { AddStockItem } from "./add-stock-item"
import { CreateUserAccount } from "./create-user-account"
import { ManageUsers } from "./manage-users"
import { StockList } from "./stock-list"
import { SalesRecord } from "./sales-record"
import { ChangeAdminPassword } from "./change-admin-password"
import { AdminZReport } from "./admin-z-report"

export default function AdminContent() {
  return (
    <>
      <div className="mb-8 flex space-x-4">
        <AddStockItem />
        <CreateUserAccount />
        <ChangeAdminPassword />
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Inventory</h2>
        <StockList />
      </div>
      <div className="mb-8">
        <SalesRecord />
      </div>
      <div className="mb-8">
        <AdminZReport />
      </div>
      <div className="mb-8">
        <ManageUsers />
      </div>
    </>
  )
}

