import { useCallback, useEffect, useMemo, useState } from "react";
import { CarFront, Search, SlidersHorizontal, LogOut, Plus, ShieldCheck, Gauge, Fuel, ArrowUpRight } from "lucide-react";
import { api, getToken, setToken, type User, type Vehicle } from "./api";

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(value);

function AuthPanel({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await api.auth(mode, email, password);
      setToken(result.token); onAuth(result.user);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in"); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <div className="auth-brand"><div className="brand-mark"><CarFront size={25}/></div><span>NORTHSTAR <b>MOTORS</b></span></div>
    <section className="auth-card">
      <span className="eyebrow">THE DRIVER'S SEAT</span>
      <h1>{mode === "login" ? "Welcome back." : "Join the journey."}</h1>
      <p className="muted">{mode === "login" ? "Sign in to explore our current collection." : "Create an account to browse and purchase vehicles."}</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === "login" ? "current-password" : "new-password"}/></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-wide" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={17}/></button>
      </form>
      <p className="auth-switch">{mode === "login" ? "New to Northstar?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
    </section>
    <p className="auth-foot">A BETTER WAY TO FIND YOUR NEXT DRIVE.</p>
  </main>;
}

function VehicleCard({ vehicle, isAdmin, onPurchase, onEdit, onDelete }: {
  vehicle: Vehicle; isAdmin: boolean; onPurchase: (id: string) => void;
  onEdit: (vehicle: Vehicle) => void; onDelete: (id: string) => void;
}) {
  const initials = vehicle.make.slice(0, 1) + vehicle.model.slice(0, 1);
  return <article className="vehicle-card">
    <div className={`car-visual visual-${vehicle.category.toLowerCase().replace(/[^a-z]/g, "")}`}>
      <div className="visual-top"><span className="category-pill">{vehicle.category}</span><span className="vehicle-id">NS / {vehicle.id.slice(-5).toUpperCase()}</span></div>
      <div className="car-art"><CarFront size={104} strokeWidth={0.85}/><span className="car-shadow"/></div>
      <span className="visual-initials">{initials}</span>
    </div>
    <div className="vehicle-body">
      <div className="vehicle-title-row"><div><p className="make-label">{vehicle.make}</p><h3>{vehicle.model}</h3></div><span className="price">{money(vehicle.price)}</span></div>
      <div className="spec-row"><span><Gauge size={15}/> Inventory</span><strong className={vehicle.quantity === 0 ? "stock-out" : vehicle.quantity < 3 ? "stock-low" : "stock-good"}>{vehicle.quantity === 0 ? "Sold out" : `${vehicle.quantity} available`}</strong></div>
      <div className="card-actions"><button className="btn btn-primary purchase-btn" disabled={vehicle.quantity === 0} onClick={() => onPurchase(vehicle.id)}>{vehicle.quantity === 0 ? "Out of stock" : "Purchase vehicle"} <ArrowUpRight size={16}/></button>
      {isAdmin && <div className="admin-actions"><button className="btn btn-quiet" onClick={() => onEdit(vehicle)}>Edit</button><button className="btn btn-quiet danger-text" onClick={() => onDelete(vehicle.id)}>Delete</button></div>}</div>
    </div>
  </article>;
}

function VehicleForm({ vehicle, onClose, onSave }: { vehicle?: Vehicle; onClose: () => void; onSave: (v: Omit<Vehicle, "id">) => Promise<void> }) {
  const [form, setForm] = useState({ make: vehicle?.make ?? "", model: vehicle?.model ?? "", category: vehicle?.category ?? "Sedan", price: String(vehicle?.price ?? ""), quantity: String(vehicle?.quantity ?? "1") });
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await onSave({ ...form, price: Number(form.price), quantity: Number(form.quantity) }); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save vehicle"); }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="modal-heading"><div><span className="eyebrow">INVENTORY MANAGEMENT</span><h2 id="form-title">{vehicle ? "Update vehicle" : "Add a vehicle"}</h2></div><button className="close-btn" onClick={onClose} aria-label="Close">×</button></div>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-grid"><label>Make<input required value={form.make} onChange={e => setForm({...form, make:e.target.value})}/></label><label>Model<input required value={form.model} onChange={e => setForm({...form, model:e.target.value})}/></label></div>
        <label>Category<select value={form.category} onChange={e => setForm({...form, category:e.target.value})}><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Coupe</option><option>Electric</option><option>Truck</option><option>Luxury</option></select></label>
        <div className="form-grid"><label>Price (INR)<input type="number" min="1" step="1" required value={form.price} onChange={e => setForm({...form, price:e.target.value})}/></label><label>Quantity<input type="number" min="0" step="1" required value={form.quantity} onChange={e => setForm({...form, quantity:e.target.value})}/></label></div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-wide">Save vehicle <ArrowUpRight size={16}/></button>
      </form>
    </section>
  </div>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState({ make: "", model: "", category: "", minPrice: "", maxPrice: "" });
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formVehicle, setFormVehicle] = useState<Vehicle | null | undefined>(undefined);
  const isAdmin = user?.role === "ADMIN";
  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true); setError("");
    try { setVehicles(searching ? await api.search(filters) : await api.vehicles()); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load inventory"); }
    finally { setLoading(false); }
  }, [filters, searching]);
  useEffect(() => { if (getToken()) load(); }, [load]);
  const totalStock = useMemo(() => vehicles.reduce((sum, v) => sum + v.quantity, 0), [vehicles]);
  const totalValue = useMemo(() => vehicles.reduce((sum, v) => sum + v.price * v.quantity, 0), [vehicles]);

  async function purchase(id: string) {
    setNotice(""); setError("");
    try { await api.purchase(id); setNotice("Purchase completed. Inventory has been updated."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Purchase failed"); }
  }
  async function save(input: Omit<Vehicle, "id">) {
    if (formVehicle) await api.update(formVehicle.id, input); else await api.create(input);
    setNotice(formVehicle ? "Vehicle updated." : "Vehicle added."); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this vehicle from inventory?")) return;
    try { await api.remove(id); setNotice("Vehicle deleted."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  }
  function logout() { setToken(""); setUser(null); setVehicles([]); setNotice(""); }

  if (!user) return <AuthPanel onAuth={setUser}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark"><CarFront size={22}/></div><div>NORTHSTAR <b>MOTORS</b><small>DEALERSHIP OS</small></div></div>
      <div className="side-label">WORKSPACE</div><div className="nav-active"><span className="nav-dot"/>Inventory overview</div>
      <div className="sidebar-bottom"><div className="avatar">{user.email.slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user.email}</strong><span>{isAdmin ? "Administrator" : "Sales account"}</span></div><button className="icon-btn" aria-label="Sign out" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Inventory</strong></div><div className="topbar-right">{isAdmin && <span className="role-pill"><ShieldCheck size={14}/> Admin access</span>}<span className="live-dot"/> <span className="live-label">Inventory live</span></div></header>
      <section className="page-intro"><div><span className="eyebrow">NORTHSTAR / INVENTORY 01</span><h1>Find your <em>next drive.</em></h1><p>Every vehicle, one considered collection. Browse what's available.</p></div>{isAdmin && <button className="btn btn-primary add-btn" onClick={() => setFormVehicle(null)}><Plus size={17}/> Add vehicle</button>}</section>
      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><CarFront size={18}/></div><span className="stat-label">LISTED VEHICLES</span><strong>{vehicles.length.toString().padStart(2,"0")}</strong><small>Matching current view</small></div>
        <div className="stat-card"><div className="stat-icon"><SlidersHorizontal size={18}/></div><span className="stat-label">UNITS IN STOCK</span><strong>{totalStock.toLocaleString("en-IN")}</strong><small>Across listed vehicles</small></div>
        <div className="stat-card"><div className="stat-icon"><ArrowUpRight size={18}/></div><span className="stat-label">INVENTORY VALUE</span><strong className="stat-value">{money(totalValue)}</strong><small>Based on current stock</small></div>
      </section>
      <section className="inventory-section">
        <div className="section-heading"><div><h2>Available collection <span className="count-badge">{vehicles.length}</span></h2><p>Explore vehicles curated for every kind of journey.</p></div><span className="sort-label">LATEST INVENTORY <span>↕</span></span></div>
        <form className="filter-bar" onSubmit={e => { e.preventDefault(); setSearching(true); }}>
          <label className="search-input"><Search size={18}/><input aria-label="Search make" placeholder="Search make..." value={filters.make} onChange={e => setFilters({...filters, make:e.target.value})}/></label>
          <input aria-label="Search model" placeholder="Model" value={filters.model} onChange={e => setFilters({...filters, model:e.target.value})}/>
          <select aria-label="Category" value={filters.category} onChange={e => setFilters({...filters, category:e.target.value})}><option value="">All categories</option><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Coupe</option><option>Electric</option><option>Truck</option><option>Luxury</option></select>
          <input aria-label="Minimum price" type="number" min="0" placeholder="Min ₹" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice:e.target.value})}/>
          <input aria-label="Maximum price" type="number" min="0" placeholder="Max ₹" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice:e.target.value})}/>
          <button className="btn btn-dark"><Search size={16}/> Filter</button>
          {searching && <button type="button" className="btn btn-quiet" onClick={() => { setFilters({make:"",model:"",category:"",minPrice:"",maxPrice:""}); setSearching(false); }}>Reset</button>}
        </form>
        {error && <div className="alert error" role="alert">{error}</div>}{notice && <div className="alert success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}
        {loading ? <div className="empty-state">Loading the collection…</div> : vehicles.length === 0 ? <div className="empty-state"><CarFront size={35}/><h3>No vehicles found</h3><p>Try adjusting your search or check back soon.</p></div> :
          <div className="vehicle-grid">{vehicles.map(v => <VehicleCard key={v.id} vehicle={v} isAdmin={Boolean(isAdmin)} onPurchase={purchase} onEdit={setFormVehicle} onDelete={remove}/>)}</div>}
      </section>
      <footer className="page-footer"><span>© 2026 NORTHSTAR MOTORS</span><span>MADE FOR THE LOVE OF THE DRIVE.</span></footer>
    </main>
    {formVehicle !== undefined && isAdmin && <VehicleForm vehicle={formVehicle ?? undefined} onClose={() => setFormVehicle(undefined)} onSave={save}/>}
  </div>;
}
