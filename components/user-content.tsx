import { UserStockList } from "./user-stock-list"

export default function UserContent() {
  return (
    <div className="p-4">
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-semibold mb-2">Available Stock</h2>
        <UserStockList />
      </div>
    </div>
  )
}

