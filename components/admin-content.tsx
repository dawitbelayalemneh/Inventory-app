import styled from 'styled-components';
import { AddStockItem } from "./add-stock-item"
import { CreateUserAccount } from "./create-user-account"
import { ManageUsers } from "./manage-users"
import { StockList } from "./stock-list"
import { SalesRecord } from "./sales-record"
import { ChangeAdminPassword } from "./change-admin-password"
import { AdminZReport } from "./admin-z-report"
import { db } from "../lib/firebase";

const AdminContentWrapper = styled.div`
  .admin-content {
    /* Default styles */
  }

  @media (max-width: 768px) {
    .admin-content {
      /* Styles for tablets and smaller devices */
    }
  }

  @media (max-width: 480px) {
    .admin-content {
      /* Styles for mobile devices */
    }
  }
`;

export default function AdminContent() {
  return (
    <div className="p-4">
      <div className="mb-8 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <AddStockItem className="w-full md:w-auto" />
        <CreateUserAccount className="w-full md:w-auto" />
        <ChangeAdminPassword className="w-full md:w-auto" />
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Inventory</h2>
        <StockList />
      </div>
      <div className="mb-8">
        <SalesRecord />
      </div>
      <div className="mb-8">
        <AdminZReport className="w-full" />
      </div>
      <div className="mb-8">
        <ManageUsers />
      </div>
    </div>
  )
}

