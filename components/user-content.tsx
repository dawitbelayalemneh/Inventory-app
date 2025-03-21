import { UserStockList } from "./user-stock-list"

export default function UserContent() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Available Stock</h2>
        <UserStockList />
      </div>
    </>
  )
}

