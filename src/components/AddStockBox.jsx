import { useState } from 'react'

export default function AddStockBox({ onAdd, placeholder }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!value.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onAdd(value.trim())
      setValue('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 min-w-[240px] bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={busy}
          className="bg-gradient-to-r from-accent-bright to-accent text-[#171307] font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          + Add
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red">{error}</div>}
    </div>
  )
}
