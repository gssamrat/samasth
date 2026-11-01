import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Factory,
  PackagePlus,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SECTIONS = {
  sales: () => dashboardAPI.getSalesStats(),
  inventory: () => dashboardAPI.getInventoryStats(),
  todos: () => dashboardAPI.getTodoStats(),
  financial: () => dashboardAPI.getFinancialStats(),
  customers: () => dashboardAPI.getCustomerStats(),
  suppliers: () => dashboardAPI.getSupplierStats(),
  lowStock: () => dashboardAPI.getLowStockAlerts(),
  topProducts: () => dashboardAPI.getTopProducts(),
};

const initialState = Object.keys(SECTIONS).reduce(
  (acc, key) => ({ ...acc, [key]: { loading: true, error: null, data: null } }),
  {}
);

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0);

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);

  const load = useCallback(async (key) => {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
    try {
      const data = await SECTIONS[key]();
      setState((prev) => ({ ...prev, [key]: { loading: false, error: null, data } }));
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      setState((prev) => ({
        ...prev,
        [key]: { loading: false, error: error.message || `Failed to load ${key} data`, data: null },
      }));
    }
  }, []);

  const loadAll = useCallback(() => Promise.all(Object.keys(SECTIONS).map(load)), [load]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const anyLoading = Object.values(state).some((s) => s.loading);
  const failed = Object.keys(state).filter((k) => state[k].error);

  const { sales, inventory, todos, financial, customers, suppliers, lowStock, topProducts } = state;
  const firstName = (user?.g_fullname || user?.g_username || '').split(' ')[0];

  const revenue = financial.data?.revenue || 0;
  const profit = financial.data?.profit || 0;
  const expenses = financial.data?.expenses || 0;
  const barBase = Math.max(revenue, profit, expenses, 1);

  const lowItems = lowStock.data?.items ?? [];
  const products = topProducts.data?.products ?? [];

  return (
    <div className="min-h-screen w-full bg-background p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.025em]">
              Good {greeting()}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">Here&apos;s how the business is doing.</p>
          </div>
          <button
            type="button"
            onClick={loadAll}
            disabled={anyLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${anyLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {failed.length > 0 && !anyLoading && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <span>Couldn&apos;t load: {failed.join(', ')}.</span>
            <button
              type="button"
              onClick={() => failed.forEach(load)}
              className="font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4">
          <Kpi
            i={0}
            span="col-span-6 lg:col-span-3"
            accent
            icon={TrendingUp}
            label="Sales, last 30 days"
            loading={sales.loading}
            value={formatCurrency(sales.data?.total_sales)}
            sub={
              sales.data?.trend_percentage ? (
                <span>
                  {sales.data.trend === 'down' ? '▼' : '▲'} {sales.data.trend_percentage}% vs last period
                </span>
              ) : (
                `${formatNumber(sales.data?.total_orders)} orders`
              )
            }
          />
          <Kpi
            i={1}
            span="col-span-6 lg:col-span-3"
            icon={Boxes}
            label="Items in stock"
            loading={inventory.loading}
            value={formatNumber(inventory.data?.total_items)}
            sub={`${formatCurrency(inventory.data?.total_value)} value`}
          />
          <Kpi
            i={2}
            span="col-span-6 lg:col-span-3"
            icon={AlertTriangle}
            label="Low stock"
            loading={lowStock.loading}
            value={formatNumber(lowStock.data?.count ?? lowItems.length)}
            tone={(lowStock.data?.count ?? lowItems.length) > 0 ? 'warn' : undefined}
            sub={
              <Link to="/stock" className="underline-offset-2 hover:underline">
                Review stock
              </Link>
            }
          />
          <Kpi
            i={3}
            span="col-span-6 lg:col-span-3"
            icon={Users}
            label="Customers"
            loading={customers.loading}
            value={formatNumber(customers.data?.total_customers)}
            sub={
              customers.data?.new_customers_this_month
                ? `+${formatNumber(customers.data.new_customers_this_month)} this month`
                : `${formatNumber(customers.data?.active_customers)} active`
            }
          />

          {/* Financial summary */}
          <section className="rise card-surface col-span-12 p-5 lg:col-span-8" style={{ '--i': 4 }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Financial summary</h2>
              <span className="text-xs text-foreground-muted">This month</span>
            </div>
            {financial.loading ? (
              <Skeleton rows={3} />
            ) : financial.error ? (
              <p className="py-10 text-center text-sm text-foreground-muted">Financial data is unavailable right now.</p>
            ) : (
              <div className="space-y-4">
                <Bar label="Revenue" value={revenue} base={barBase} color="var(--brand)" />
                <Bar label="Profit" value={profit} base={barBase} color="var(--green-900)" />
                <Bar label="Expenses" value={expenses} base={barBase} color="var(--warning)" />
              </div>
            )}
          </section>

          {/* Tasks + suppliers */}
          <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <section className="rise card-surface p-5" style={{ '--i': 5 }}>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                <ClipboardList className="h-4 w-4 text-brand" aria-hidden="true" />
                Pending tasks
              </div>
              <p className="num-xl mt-3">{todos.loading ? '…' : formatNumber(todos.data?.pending_count)}</p>
              <p className="mt-2 text-xs text-foreground-muted">
                <span className="font-semibold text-danger">{formatNumber(todos.data?.high_priority)}</span> high priority ·{' '}
                {formatNumber(todos.data?.completed_today)} done today
              </p>
            </section>
            <section className="rise card-surface p-5" style={{ '--i': 6 }}>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
                <Factory className="h-4 w-4 text-brand" aria-hidden="true" />
                Suppliers
              </div>
              <p className="num-xl mt-3">{suppliers.loading ? '…' : formatNumber(suppliers.data?.total_suppliers)}</p>
              <p className="mt-2 text-xs text-foreground-muted">
                {formatNumber(suppliers.data?.active_suppliers)} active ·{' '}
                <span className="font-semibold text-warning">{formatNumber(suppliers.data?.pending_orders)}</span> orders pending
              </p>
            </section>
          </div>

          {/* Lists */}
          <ListCard
            i={7}
            title="Low inventory"
            href="/stock"
            loading={lowStock.loading}
            error={lowStock.error}
            empty="All items are well stocked."
            rows={lowItems.slice(0, 6).map((item, idx) => ({
              k: item.id ?? idx,
              a: item.name,
              b: item.sku || item.barcode || '',
              end: <Pill tone="warn">{item.quantity} left</Pill>,
            }))}
          />
          <ListCard
            i={8}
            title="Top products"
            href="/sales"
            loading={topProducts.loading}
            error={topProducts.error}
            empty="No sales data yet."
            rows={products.slice(0, 6).map((p, idx) => ({
              k: p.id ?? idx,
              a: p.name,
              b: `${formatNumber(p.quantity_sold)} sold`,
              end: <span className="tabular text-sm font-semibold">{formatCurrency(p.revenue)}</span>,
            }))}
          />
          <ListCard
            i={9}
            title="Business snapshot"
            href="/reports"
            loading={sales.loading && inventory.loading}
            empty="No data yet."
            rows={[
              { k: 'orders', a: 'Orders (30 days)', b: 'Sales', end: <span className="tabular text-sm font-semibold">{formatNumber(sales.data?.total_orders)}</span> },
              { k: 'avg', a: 'Average order', b: 'Sales', end: <span className="tabular text-sm font-semibold">{formatCurrency(sales.data?.avg_order_value)}</span> },
              { k: 'value', a: 'Inventory value', b: 'Stock', end: <span className="tabular text-sm font-semibold">{formatCurrency(inventory.data?.total_value)}</span> },
              { k: 'cats', a: 'Categories', b: 'Stock', end: <span className="tabular text-sm font-semibold">{formatNumber(inventory.data?.total_categories)}</span> },
            ]}
          />
        </div>

        {/* Quick actions */}
        <section className="rise card-surface mt-4 p-5" style={{ '--i': 10 }}>
          <h2 className="mb-3 text-[0.95rem] font-semibold tracking-tight">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Add product', icon: PackagePlus, to: '/items' },
              { label: 'New sale', icon: ShoppingCart, to: '/sales' },
              { label: 'Add partner', icon: UserPlus, to: '/partners' },
              { label: 'Stock entry', icon: Boxes, to: '/stock' },
              { label: 'Reports', icon: BarChart3, to: '/reports' },
              { label: 'Settings', icon: Settings, to: '/settings' },
            ].map(({ label, icon, to }) => {
              const Icon = icon;
              return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-2 rounded-xl! border-border! bg-surface-muted! px-3 py-4 text-xs font-medium text-foreground! transition-colors hover:bg-brand-soft!"
              >
                <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                {label}
              </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

function Kpi({ i, span, icon, label, value, sub, accent, tone, loading }) {
  const Icon = icon;
  const iconColor = accent
    ? 'text-white/80'
    : tone === 'warn'
      ? 'text-warning'
      : tone === 'bad'
        ? 'text-danger'
        : 'text-brand';
  return (
    <div
      className={`rise ${span} rounded-2xl border p-5 ${accent ? 'border-transparent bg-[var(--green-900)] text-white' : 'card-surface'}`}
      style={{ '--i': i }}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
        <p className={`text-xs font-medium ${accent ? 'text-white/75' : 'text-foreground-muted'}`}>{label}</p>
      </div>
      <p className="num-xl mt-3 truncate">{loading ? '…' : value}</p>
      {sub && !loading && (
        <div className={`mt-2 text-xs ${accent ? 'text-white/75' : 'text-foreground-muted'}`}>{sub}</div>
      )}
    </div>
  );
}

function Bar({ label, value, base, color }) {
  const pct = Math.max(2, Math.min(100, (Math.max(value, 0) / base) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular font-semibold">{formatCurrency(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Pill({ tone, children }) {
  const tones = {
    warn: 'bg-warning-soft text-warning',
    bad: 'bg-danger-soft text-danger',
    good: 'bg-success-soft text-success',
  };
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-8 animate-pulse rounded-lg bg-surface-muted" />
      ))}
    </div>
  );
}

function ListCard({ i, title, href, rows, empty, loading, error }) {
  return (
    <section className="rise card-surface col-span-12 p-5 lg:col-span-4" style={{ '--i': i }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[0.95rem] font-semibold tracking-tight">{title}</h2>
        <Link to={href} className="text-xs font-medium text-brand! hover:underline">
          View all
        </Link>
      </div>
      {loading ? (
        <Skeleton rows={3} />
      ) : error ? (
        <p className="py-6 text-center text-sm text-foreground-muted">Couldn&apos;t load this section.</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.k} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.a}</p>
                {r.b && <p className="truncate text-xs text-foreground-muted">{r.b}</p>}
              </div>
              {r.end}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default Dashboard;
