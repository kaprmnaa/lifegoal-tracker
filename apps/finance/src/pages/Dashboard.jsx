import { useEffect, useMemo, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatsBar from '../components/StatsBar'
import CandleChart from '../components/CandleChart'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import ChainBackground from '../components/ChainBackground'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { buildCandles, periodLabel } from '../utils/aggregate'

const PERIODS = ['daily', 'weekly', 'monthly']

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('daily')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const loadTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('financetrack_transactions')
      .select('id, amount, category, description, occurred_at, created_at')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setTransactions(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const candles = useMemo(() => buildCandles(transactions, period), [transactions, period])

  async function handleAdd(payload) {
    const { error: insertError } = await supabase
      .from('financetrack_transactions')
      .insert({ ...payload, user_id: user.id })
    if (insertError) throw insertError
    await loadTransactions()
  }

  async function handleDelete(id) {
    const prev = transactions
    setTransactions(transactions.filter((t) => t.id !== id))
    const { error: deleteError } = await supabase
      .from('financetrack_transactions')
      .delete()
      .eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      setTransactions(prev)
    }
  }

  return (
    <div className="app-shell">
      <ChainBackground />
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <div>
            <div className="page-title">Ledger Pengeluaran</div>
            <div className="page-sub">Setiap uang keluar adalah satu blok di chain kamu.</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tambah Pengeluaran</button>
        </div>

        {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

        <StatsBar transactions={transactions} />

        <div className="chain-divider">
          <span className="node lit" />
          <span className="link" />
          <span className="node" />
          <span className="link" />
          <span className="node" />
        </div>

        <div className="chart-panel">
          <div className="panel-title">
            <span>Candle Pengeluaran — {periodLabel(period)}</span>
            <div className="period-tabs">
              {PERIODS.map((p) => (
                <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
                  {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Memuat data…</div>
          ) : candles.length > 0 ? (
            <CandleChart candles={candles} />
          ) : (
            <div className="empty-state">Belum ada pengeluaran untuk ditampilkan.</div>
          )}

          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: 'var(--up)' }} /> Hijau — naik, keluar lebih banyak dari periode sebelumnya</span>
            <span><span className="legend-dot" style={{ background: 'var(--down)' }} /> Merah — turun, keluar lebih sedikit dari periode sebelumnya</span>
          </div>
        </div>

        <div className="panel ledger">
          <div className="ledger-header">
            <span className="panel-title">Riwayat Transaksi</span>
          </div>
          <TransactionList transactions={transactions} onDelete={handleDelete} />
        </div>
      </main>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} onSubmit={handleAdd} />}
    </div>
  )
}
