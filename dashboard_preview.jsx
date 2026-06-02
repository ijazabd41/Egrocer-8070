
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ── Data ──────────────────────────────────────────────────────────────────
const revenueData = [
  {d:"Mon",rev:3200,orders:18},{d:"Tue",rev:4100,orders:24},
  {d:"Wed",rev:3600,orders:20},{d:"Thu",rev:5200,orders:31},
  {d:"Fri",rev:4800,orders:28},{d:"Sat",rev:6100,orders:36},
  {d:"Sun",rev:5900,orders:34},
];
const hourlyData = [
  {h:"8am",r:800},{h:"9am",r:2100},{h:"10am",r:3800},{h:"11am",r:4200},
  {h:"12pm",r:5600},{h:"1pm",r:3200},{h:"2pm",r:4400},{h:"3pm",r:5100},
  {h:"4pm",r:4800},{h:"5pm",r:3600},{h:"6pm",r:2800},{h:"7pm",r:1400},
];
const catData = [
  {name:"Dairy",value:38},{name:"Beverages",value:26},
  {name:"Bakery",value:18},{name:"Produce",value:11},{name:"Others",value:7},
];
const payData = [
  {name:"Card",value:52},{name:"Cash on Del.",value:28},
  {name:"Online Pay",value:13},{name:"Bank Transfer",value:7},
];
const deliveryData = [
  {id:"OUT/04134",customer:"Ahmed Al Rashid",area:"Dubai Marina",driver:"Mohammed F.",status:"in_transit"},
  {id:"OUT/04135",customer:"Sara Mohammed",area:"JBR Walk",driver:"—",status:"unassigned"},
  {id:"OUT/04136",customer:"Khalid Hassan",area:"Business Bay",driver:"Omar K.",status:"assigned"},
  {id:"OUT/04137",customer:"Fatima Al Zaabi",area:"Al Barsha",driver:"Ali H.",status:"done"},
  {id:"OUT/04138",customer:"Omar Faisal",area:"Downtown",driver:"—",status:"unassigned"},
];
const stockData = [
  {name:"Fresh Milk 1L",cat:"Dairy",barcode:"8801073143203",sys:240,counted:null},
  {name:"Mineral Water 6pk",cat:"Beverages",barcode:"6281011000064",sys:180,counted:178},
  {name:"Orange Juice 1L",cat:"Beverages",barcode:"5449000131805",sys:95,counted:null},
  {name:"Bread Loaf",cat:"Bakery",barcode:"6221157030022",sys:60,counted:55},
  {name:"Eggs 12-Pack",cat:"Dairy",barcode:"5010251005032",sys:120,counted:120},
];
const lowStockData = [
  {name:"Butter 250g",cat:"Dairy",qty:4,min:20},
  {name:"Tomato Paste",cat:"Pantry",qty:2,min:15},
  {name:"Greek Yogurt",cat:"Dairy",qty:8,min:25},
  {name:"Olive Oil 1L",cat:"Pantry",qty:3,min:12},
];
const topProducts = [
  {name:"🥛 Fresh Milk 1L",qty:320,rev:4800},
  {name:"💧 Mineral Water 6pk",qty:280,rev:3360},
  {name:"🍊 Orange Juice 1L",qty:210,rev:2940},
  {name:"🍞 Bread Loaf",qty:195,rev:1950},
  {name:"🥚 Eggs 12-Pack",qty:165,rev:1815},
];

// ── Themes ────────────────────────────────────────────────────────────────
const T = {
  web1: {
    bg:"#FFF8F8", sidebar:"#FFFFFF", card:"#FFFFFF", border:"#F2F2F2",
    topbar:"#FFFFFF", text:"#1A1A1A", textMid:"#333333", textSoft:"#9E9E9E",
    primary:"#D61F26", primaryLt:"#FFE8E9",
    green:"#2ECC71", greenLt:"#E8F8F0",
    red:"#A8151B", redLt:"#FFE8E9",
    navHover:"#FFF8F8", navActive:"#FFE8E9",
    chartColors:["#D61F26","#F5C800","#2980B9","#2ECC71","#9E9E9E"],
    chartLine:"#D61F26", chartArea:"rgba(214,31,38,.1)",
    chartBar:"rgba(214,31,38,.75)",
    chartGrid:"#F2F2F2",
    font:"Nunito, sans-serif",
    shadow:"0 2px 12px rgba(214,31,38,.08)",
    label:"Web1 — Coop Light",
  },
  web6: {
    bg:"#141414", sidebar:"#1A1A1A", card:"#202934", border:"rgba(255,255,255,.08)",
    topbar:"#1A1A1A", text:"#FFFFFF", textMid:"#9E9E9E", textSoft:"#666666",
    primary:"#FF3B42", primaryLt:"rgba(214,31,38,.18)",
    green:"#2ECC71", greenLt:"rgba(46,204,113,.15)",
    red:"#FF3B42", redLt:"rgba(214,31,38,.2)",
    navHover:"rgba(255,255,255,.04)", navActive:"rgba(214,31,38,.12)",
    chartColors:["#FF3B42","#F5C800","#2980B9","#2ECC71","#4A5568"],
    chartLine:"#FF3B42", chartArea:"rgba(255,59,66,.08)",
    chartBar:"rgba(255,59,66,.6)",
    chartGrid:"rgba(255,255,255,.06)",
    font:"Nunito, sans-serif",
    shadow:"0 4px 20px rgba(0,0,0,.35)",
    label:"Web6 — Coop Dark",
  }
};

// ── Status pill ───────────────────────────────────────────────────────────
function Pill({status, t}) {
  const map = {
    in_transit:  {bg:"rgba(37,99,235,.15)",  color:"#60A5FA", label:"In Transit"},
    assigned:    {bg:"rgba(245,158,11,.15)",  color:"#FCD34D", label:"Assigned"},
    unassigned:  {bg:"rgba(220,38,38,.15)",   color:"#FCA5A5", label:"Unassigned"},
    done:        {bg:"rgba(22,163,74,.15)",   color:"#4ADE80", label:"Delivered"},
  };
  const s = map[status] || {bg:"rgba(100,116,139,.15)", color:"#94A3B8", label:status};
  return (
    <span style={{
      background:s.bg, color:s.color,
      padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:700,
    }}>{s.label}</span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({icon, label, value, sub, badge, badgeUp, t}) {
  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`,
      borderRadius:14, padding:18, boxShadow:t.shadow,
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{
          width:40,height:40,borderRadius:11,
          background:t.primaryLt,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,
        }}>{icon}</div>
        {badge && (
          <span style={{
            background: badgeUp ? t.greenLt : t.redLt,
            color: badgeUp ? t.green : t.red,
            fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20,
          }}>{badgeUp?"↑":"↓"} {badge}</span>
        )}
      </div>
      <div style={{fontSize:22,fontWeight:800,color:t.text,letterSpacing:"-0.5px"}}>{value}</div>
      <div style={{fontSize:12,color:t.textMid,marginTop:3}}>{label}</div>
      {sub && <div style={{fontSize:11,color:t.textSoft,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function Card({title, sub, children, action, t}) {
  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`,
      borderRadius:14, padding:20,
    }}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:t.text}}>{title}</div>
          {sub && <div style={{fontSize:11,color:t.textMid,marginTop:2}}>{sub}</div>}
        </div>
        {action && (
          <button style={{
            background:"transparent", border:`1px solid ${t.border}`,
            color:t.primary, borderRadius:7, padding:"4px 10px",
            fontSize:12, fontWeight:600, cursor:"pointer",
          }}>{action}</button>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Mini stat bar ─────────────────────────────────────────────────────────
function MiniStats({items, t}) {
  return (
    <div style={{
      display:"flex", border:`1px solid ${t.border}`,
      borderRadius:12, overflow:"hidden", marginBottom:24,
      background:t.card,
    }}>
      {items.map((item,i) => (
        <div key={i} style={{
          flex:1, padding:"14px 8px", textAlign:"center",
          borderRight: i < items.length-1 ? `1px solid ${t.border}` : "none",
        }}>
          <div style={{fontSize:22,fontWeight:800,color:item.color||t.primary}}>{item.val}</div>
          <div style={{fontSize:11,color:t.textMid,marginTop:2}}>{item.lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────
function ChartTip({active, payload, label, t, prefix=""}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`,
      borderRadius:8, padding:"8px 12px", fontSize:12,
      color:t.text, boxShadow:"0 4px 12px rgba(0,0,0,.2)",
    }}>
      <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color}}>
          {p.name}: {prefix}{p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// OWNER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function OwnerDashboard({t}) {
  const [period, setPeriod] = useState("today");
  const periods = [["today","Today"],["this_week","Week"],["this_month","Month"],["custom","Custom"]];
  return (
    <div>
      {/* Period tabs + title row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:t.text}}>Sales Dashboard</div>
          <div style={{fontSize:12,color:t.textMid}}>Sunday, 31 May 2026 — Good morning, Ahmed 👋</div>
        </div>
        <div style={{
          display:"flex", background:t.card, border:`1px solid ${t.border}`,
          borderRadius:10, padding:4, gap:2,
        }}>
          {periods.map(([code,label]) => (
            <button key={code} onClick={()=>setPeriod(code)} style={{
              padding:"6px 14px", borderRadius:7, border:"none",
              background: period===code ? t.primary : "transparent",
              color: period===code ? "#fff" : t.textMid,
              fontSize:12, fontWeight:600, cursor:"pointer",
              transition:"all .15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard icon="💰" label="Total Revenue" value="AED 48.2K"
          sub="Invoiced: AED 38.4K" badge="14.2%" badgeUp t={t}/>
        <KpiCard icon="🛍️" label="Total Orders" value="142"
          sub="864 items sold" badge="8 orders" badgeUp t={t}/>
        <KpiCard icon="👥" label="New Customers" value="28"
          sub="Avg order AED 339" badge="5 new" badgeUp t={t}/>
        <KpiCard icon="✅" label="Amount Paid" value="AED 31.2K"
          sub="AED 7.2K pending" badge="AED 2.6K" badgeUp={false} t={t}/>
      </div>

      {/* Order status mini bar */}
      <MiniStats t={t} items={[
        {val:"98",lbl:"Confirmed",color:"#3B82F6"},
        {val:"12",lbl:"Pending",color:"#F59E0B"},
        {val:"24",lbl:"Delivered",color:t.green},
        {val:"8",lbl:"Cancelled",color:t.red},
        {val:"4",lbl:"Refunds",color:"#8B5CF6"},
      ]}/>

      {/* Revenue Trend + Payment Methods */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <Card title="📈 Revenue Trend" sub="Daily revenue this period" action="Export" t={t}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.chartLine} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={t.chartLine} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{fontSize:10,fill:t.textSoft}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:t.textSoft}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip t={t} prefix="AED "/>}/>
              <Area type="monotone" dataKey="rev" name="Revenue"
                stroke={t.chartLine} fill="url(#grad1)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="💳 Payment Methods" sub="By method this month" t={t}>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={payData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                dataKey="value" paddingAngle={2}>
                {payData.map((_,i) => <Cell key={i} fill={t.chartColors[i]} strokeWidth={0}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,marginTop:4}}>
            {payData.map((p,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",
                padding:"4px 0",borderBottom:`1px solid ${t.border}`,color:t.textMid}}>
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",
                    background:t.chartColors[i],display:"inline-block"}}/>
                  {p.name}
                </span>
                <strong style={{color:t.text}}>{p.value}%</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly + Category */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <Card title="🕐 Hourly Sales Today" sub="Revenue by hour" t={t}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={hourlyData} barSize={18}>
              <XAxis dataKey="h" tick={{fontSize:9,fill:t.textSoft}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:t.textSoft}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip t={t} prefix="AED "/>}/>
              <Bar dataKey="r" name="Revenue" fill={t.chartBar} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="🏷️ Category Sales" sub="Revenue share" t={t}>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                dataKey="value" paddingAngle={2}>
                {catData.map((_,i)=><Cell key={i} fill={t.chartColors[i]} strokeWidth={0}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,marginTop:4}}>
            {catData.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",
                padding:"3px 0",color:t.textMid}}>
                <span style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:7,height:7,borderRadius:"50%",
                    background:t.chartColors[i],display:"inline-block"}}/>
                  {c.name}
                </span>
                <strong style={{color:t.text}}>{c.value}%</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Products + Top Customers */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card title="🏆 Top Products" sub="Best sellers this month" action="View All" t={t}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${t.border}`}}>
                {["#","Product","Qty","Revenue"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"6px 8px",
                    color:t.textSoft,fontWeight:700,fontSize:10,
                    textTransform:"uppercase",letterSpacing:.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${t.border}`}}>
                  <td style={{padding:"9px 8px",color:t.textMid,fontSize:11}}>{i+1}</td>
                  <td style={{padding:"9px 8px",fontWeight:600,color:t.text}}>{p.name}</td>
                  <td style={{padding:"9px 8px",color:t.textMid}}>{p.qty}</td>
                  <td style={{padding:"9px 8px",fontWeight:700,color:t.primary}}>
                    AED {p.rev.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="👤 Top Customers" sub="By spend this month" action="View All" t={t}>
          {[
            {n:"Ahmed Al Rashid",o:12,s:4200,i:"AH",c:"#D61F26"},
            {n:"Sara Mohammed",o:9,s:3150,i:"SM",c:"#3B82F6"},
            {n:"Khalid Hassan",o:7,s:2450,i:"KH",c:"#8B5CF6"},
            {n:"Fatima Al Zaabi",o:6,s:2100,i:"FZ",c:"#F59E0B"},
          ].map((c,i)=>(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:12,
              padding:"10px 0",
              borderBottom: i<3 ? `1px solid ${t.border}` : "none",
            }}>
              <div style={{
                width:38,height:38,borderRadius:10,
                background:c.c,color:"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:700,flexShrink:0,
              }}>{c.i}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:t.text}}>{c.n}</div>
                <div style={{fontSize:11,color:t.textMid}}>{c.o} orders</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:t.primary}}>AED {c.s.toLocaleString()}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DELIVERY DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function DeliveryDashboard({t}) {
  const [view, setView] = useState("manager");
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:t.text}}>Delivery Dashboard</div>
          <div style={{fontSize:12,color:t.textMid}}>Real-time delivery tracking</div>
        </div>
        <div style={{
          display:"flex",background:t.card,border:`1px solid ${t.border}`,
          borderRadius:8,padding:3,gap:2,
        }}>
          {[["manager","Manager View"],["boy","Delivery Boy"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"6px 14px",borderRadius:6,border:"none",
              background:view===v?t.primary:"transparent",
              color:view===v?"#fff":t.textMid,
              fontSize:12,fontWeight:600,cursor:"pointer",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard icon="📦" label="Total Today" value="45" sub="Scheduled" t={t}/>
        <KpiCard icon="⚠️" label="Unassigned" value="8" sub="Need driver assignment"
          badge="Needs action" badgeUp={false} t={t}/>
        <KpiCard icon="🔵" label="In Transit" value="10" sub="Currently delivering" t={t}/>
        <KpiCard icon="✅" label="Delivered" value="14" sub="Avg 28 min"
          badge="82% on-time" badgeUp t={t}/>
      </div>

      {view==="manager" ? (
        <div>
          {/* Deliveries table */}
          <Card title="📋 Today's Deliveries" sub="All orders with status" t={t}>
            {/* Filter pills */}
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {["All","Unassigned","In Transit","Delivered"].map(f=>(
                <span key={f} style={{
                  padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                  background:f==="All"?t.primary:t.primaryLt,
                  color:f==="All"?"#fff":t.primary,cursor:"pointer",
                }}>{f}</span>
              ))}
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Order","Customer","Area","Driver","Status","Action"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 10px",
                      color:t.textSoft,fontSize:10,fontWeight:700,
                      textTransform:"uppercase",borderBottom:`1px solid ${t.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveryData.map((d,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${t.border}`}}>
                    <td style={{padding:"10px",fontWeight:600,
                      color:d.status==="unassigned"?t.red:t.primary,fontSize:11}}>{d.id}</td>
                    <td style={{padding:"10px",color:t.text}}>{d.customer}</td>
                    <td style={{padding:"10px",color:t.textMid}}>{d.area}</td>
                    <td style={{padding:"10px",color:d.driver==="—"?t.red:t.textMid}}>{d.driver}</td>
                    <td style={{padding:"10px"}}><Pill status={d.status} t={t}/></td>
                    <td style={{padding:"10px"}}>
                      <button style={{
                        background: d.status==="unassigned" ? t.primary : "transparent",
                        border: `1px solid ${d.status==="unassigned" ? t.primary : t.border}`,
                        color: d.status==="unassigned" ? "#fff" : t.textMid,
                        borderRadius:7,padding:"5px 12px",
                        fontSize:11,fontWeight:600,cursor:"pointer",
                      }}>
                        {d.status==="unassigned" ? "Assign" : d.status==="done" ? "Details" : "Track"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        /* Delivery Boy View */
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* Active delivery */}
          <div style={{
            background:`linear-gradient(135deg,${t.primary}22,${t.primary}44)`,
            border:`1px solid ${t.primary}66`,
            borderRadius:14,padding:20,
          }}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:700,color:t.text}}>🔵 Active Delivery</div>
              <Pill status="in_transit" t={t}/>
            </div>
            <div style={{background:t.card,borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,color:t.textSoft,marginBottom:4}}>WH/OUT/04134</div>
              <div style={{fontSize:17,fontWeight:700,color:t.text,marginBottom:8}}>Ahmed Al Rashid</div>
              <div style={{fontSize:13,color:t.textMid}}>📍 Shop 12, Dubai Marina Mall</div>
              <div style={{fontSize:13,color:t.textMid,marginTop:4}}>📞 971501234567</div>
              <div style={{marginTop:10,display:"flex",gap:12}}>
                <span style={{fontSize:14,fontWeight:700,color:t.primary}}>AED 450</span>
                <span style={{fontSize:13,color:t.textMid}}>6 items</span>
              </div>
            </div>
            {/* Map placeholder */}
            <div style={{
              background:`linear-gradient(135deg,${t.primaryLt},${t.navActive})`,
              borderRadius:10,height:140,
              display:"flex",alignItems:"center",justifyContent:"center",
              flexDirection:"column",gap:6,marginBottom:14,
            }}>
              <div style={{fontSize:40}}>🗺️</div>
              <div style={{fontSize:12,fontWeight:600,color:t.primary}}>Live Map View</div>
              <div style={{fontSize:11,color:t.textMid}}>Integrate Google Maps here</div>
            </div>
            {/* OTP */}
            <div style={{
              background:t.card,border:`1px solid ${t.primary}44`,
              borderRadius:10,padding:12,marginBottom:12,
            }}>
              <div style={{fontSize:12,fontWeight:600,color:t.primary,marginBottom:8}}>OTP Verification</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input style={{
                  flex:1,border:`2px solid ${t.primary}`,borderRadius:8,
                  padding:"8px 10px",fontSize:20,fontWeight:800,
                  letterSpacing:8,textAlign:"center",
                  background:t.card,color:t.text,fontFamily:"monospace",
                }} placeholder="——————"/>
                <button style={{
                  background:t.primary,color: t.bg==="#141414"?"#000":"#fff",
                  border:"none",borderRadius:8,
                  padding:"10px 14px",fontWeight:700,fontSize:12,cursor:"pointer",
                }}>Verify</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{flex:1,background:t.redLt,color:t.red,border:"none",
                borderRadius:8,padding:"10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>⏳ Not Home</button>
              <button style={{flex:2,background:t.primary,color:t.bg==="#141414"?"#000":"#fff",border:"none",
                borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✅ Confirm Delivered</button>
            </div>
          </div>
          {/* My orders list */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Card title="📋 My Orders" sub="Today's queue" t={t}>
              {[
                {n:"Sara Mohammed",a:"JBR Walk",p:"AED 180",s:"Queued"},
                {n:"Khalid Hassan",a:"Business Bay",p:"AED 320",s:"Queued"},
                {n:"Layla Nasser",a:"DIFC",p:"AED 210",s:"Done"},
              ].map((o,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 0",borderBottom:i<2?`1px solid ${t.border}`:"none",
                }}>
                  <div style={{
                    width:34,height:34,borderRadius:9,
                    background:o.s==="Done"?t.greenLt:t.primaryLt,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,
                  }}>{o.s==="Done"?"✓":i+2}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:t.text}}>{o.n}</div>
                    <div style={{fontSize:11,color:t.textMid}}>{o.a}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,fontWeight:700,color:t.text}}>{o.p}</div>
                    <span style={{
                      fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:10,
                      background:o.s==="Done"?t.greenLt:t.primaryLt,
                      color:o.s==="Done"?t.green:t.primary,
                    }}>{o.s}</span>
                  </div>
                </div>
              ))}
            </Card>
            <Card title="🔓 Available Deliveries" sub="Tap to accept" t={t}>
              {[
                {n:"Fatima Al Zaabi",a:"Al Barsha",p:"AED 290",d:"2.4 km"},
                {n:"Omar Faisal",a:"Downtown",p:"AED 140",d:"3.8 km"},
              ].map((a,i)=>(
                <div key={i} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"9px 0",borderBottom:i<1?`1px solid ${t.border}`:"none",
                }}>
                  <div style={{
                    width:34,height:34,borderRadius:9,background:t.primaryLt,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
                  }}>📦</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:t.text}}>{a.n}</div>
                    <div style={{fontSize:11,color:t.textMid}}>{a.a} · {a.d}</div>
                  </div>
                  <button style={{
                    background:t.primary,color:t.bg==="#141414"?"#000":"#fff",
                    border:"none",borderRadius:7,padding:"6px 12px",
                    fontSize:11,fontWeight:700,cursor:"pointer",
                  }}>Accept</button>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STOCK DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function StockDashboard({t}) {
  const [counts, setCounts] = useState({1:null,2:178,3:null,4:55,5:120});
  const counted = Object.values(counts).filter(v=>v!==null).length;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:t.text}}>Stock Management</div>
          <div style={{fontSize:12,color:t.textMid}}>Monthly inventory — May 2026</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <select style={{
            background:t.card,border:`1px solid ${t.border}`,
            color:t.text,borderRadius:8,padding:"7px 12px",fontSize:13,
          }}>
            <option>📍 WH/Stock</option>
            <option>📍 WH/Shelf A</option>
            <option>📍 WH/Cold Storage</option>
          </select>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{
              width:100,height:7,borderRadius:4,background:t.border,overflow:"hidden",
            }}>
              <div style={{
                height:"100%",width:`${(counted/5)*100}%`,
                background:t.primary,borderRadius:4,transition:"width .4s",
              }}/>
            </div>
            <span style={{fontSize:12,fontWeight:600,color:t.textMid}}>{counted}/5</span>
          </div>
          <button style={{
            background:t.primary,color:t.bg==="#141414"?"#000":"#fff",
            border:"none",borderRadius:8,padding:"8px 16px",
            fontSize:12,fontWeight:700,cursor:"pointer",
          }}>✅ Validate ({counted}/5)</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard icon="💰" label="Stock Value" value="AED 284.6K" sub="4,520 products" t={t}/>
        <KpiCard icon="⚠️" label="Low Stock" value="45" sub="12 out of stock"
          badge="Urgent" badgeUp={false} t={t}/>
        <KpiCard icon="📥" label="Pending Receipts" value="8" sub="Awaiting arrival" t={t}/>
        <KpiCard icon="🔢" label="Count Progress" value={`${counted}/5`}
          sub="Items counted today" badge={`${Math.round(counted/5*100)}%`} badgeUp t={t}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        {/* Count Sheet */}
        <Card title="🔢 Stock Count Sheet" sub="Enter physical counts" t={t}>
          <input type="text" placeholder="🔍 Search or scan barcode..."
            style={{
              width:"100%",border:`1px solid ${t.border}`,borderRadius:8,
              padding:"8px 12px",fontSize:13,marginBottom:14,
              background:t.card,color:t.text,boxSizing:"border-box",
            }}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                {["Product","System","Counted","Diff"].map(h=>(
                  <th key={h} style={{
                    textAlign:"left",padding:"6px 8px",
                    color:t.textSoft,fontSize:10,fontWeight:700,
                    textTransform:"uppercase",borderBottom:`1px solid ${t.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockData.map((s,i)=>{
                const counted = counts[i+1];
                const diff = counted !== null ? counted - s.sys : null;
                return (
                  <tr key={i} style={{borderBottom:`1px solid ${t.border}`}}>
                    <td style={{padding:"9px 8px",color:t.text,fontWeight:500}}>
                      {["🥛","💧","🍊","🍞","🥚"][i]} {s.name}
                    </td>
                    <td style={{padding:"9px 8px",fontWeight:700,color:t.text}}>{s.sys}</td>
                    <td style={{padding:"9px 8px"}}>
                      <input type="number"
                        defaultValue={counts[i+1]||""}
                        onChange={e => setCounts(p=>({...p,[i+1]:e.target.value===''?null:Number(e.target.value)}))}
                        style={{
                          width:70,border:`2px solid ${t.primary}`,borderRadius:7,
                          padding:"5px 7px",fontSize:13,fontWeight:700,
                          textAlign:"center",background:t.card,color:t.text,
                        }}/>
                    </td>
                    <td style={{padding:"9px 8px",fontWeight:700,
                      color: diff===null ? t.textSoft : diff>0 ? t.green : diff<0 ? t.red : t.textMid,
                    }}>
                      {diff===null ? "—" : diff>0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        {/* Valuation + Low Stock */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card title="💰 Stock Valuation" sub="By category" t={t}>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={28} outerRadius={55}
                  dataKey="value" paddingAngle={2}>
                  {catData.map((_,i)=><Cell key={i} fill={t.chartColors[i]} strokeWidth={0}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="⚠️ Low Stock" sub="Below minimum" t={t}>
            {lowStockData.map((s,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"8px 0",borderBottom:i<3?`1px solid ${t.border}`:"none",
              }}>
                <span style={{fontSize:22}}>{"🧈🥫🥛🫒"[i]}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:t.text}}>{s.name}</div>
                  <div style={{fontSize:10,color:t.textMid}}>{s.cat} · Min: {s.min}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:800,
                    color:s.qty<=5?t.red:t.textMid}}>{s.qty}</div>
                  <div style={{fontSize:10,color:t.textSoft}}>units</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════════════
function Sidebar({t, activeRole, activePage, onPage}) {
  const navs = {
    owner:    [{i:"📊",l:"Dashboard",p:"owner"},{i:"📈",l:"Sales Reports",p:"reports"},
               {i:"👥",l:"Customers",p:"customers"},{i:"🛍️",l:"Orders",p:"orders",badge:"12"},
               {i:"🚚",l:"Deliveries",p:"deliveries"},{i:"📦",l:"Inventory",p:"inventory"}],
    delivery: [{i:"🚚",l:"Dashboard",p:"delivery"},{i:"📋",l:"All Deliveries",p:"all",badge:"8"},
               {i:"👷",l:"Drivers",p:"drivers"},{i:"📍",l:"Live Map",p:"map"},
               {i:"✅",l:"My Deliveries",p:"mydeliveries"},{i:"🔓",l:"Available Pool",p:"pool"}],
    stock:    [{i:"📦",l:"Dashboard",p:"stock"},{i:"🔢",l:"Count Stock",p:"count",badge:"32/48"},
               {i:"⚠️",l:"Low Stock",p:"low",badge:"45"},{i:"↕️",l:"Movements",p:"moves"},
               {i:"💰",l:"Valuation",p:"value"},{i:"🐌",l:"Dead Stock",p:"dead"}],
  };
  const roleInfo = {
    owner:    {init:"AH",name:"Ahmed Hassan",role:"Company Owner",color:"#D61F26"},
    delivery: {init:"MF",name:"Mohammed Al Farsi",role:"Delivery Manager",color:"#2980B9"},
    stock:    {init:"SK",name:"Sara Khalid",role:"Stock Manager",color:"#F5C800"},
  };
  const u = roleInfo[activeRole];
  const items = navs[activeRole] || navs.owner;
  return (
    <div style={{
      background:t.sidebar, borderRight:`1px solid ${t.border}`,
      width:220, minHeight:"100vh", display:"flex", flexDirection:"column",
      flexShrink:0,
    }}>
      <div style={{
        padding:"20px 18px",fontSize:22,fontWeight:900,
        borderBottom:`1px solid ${t.border}`,letterSpacing:-0.5,
        color:t.text,
      }}>
        CD<span style={{color:t.primary}}>.COM</span>
      </div>
      <div style={{
        padding:"14px 18px",display:"flex",alignItems:"center",gap:10,
        borderBottom:`1px solid ${t.border}`,
      }}>
        <div style={{
          width:36,height:36,borderRadius:9,
          background:u.color,color:"#fff",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:12,fontWeight:700,flexShrink:0,
        }}>{u.init}</div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:t.text}}>{u.name}</div>
          <div style={{fontSize:10,color:t.textMid}}>{u.role}</div>
        </div>
      </div>
      <nav style={{padding:"10px 0",flex:1}}>
        {items.map((item,i)=>(
          <div key={i} onClick={()=>onPage(item.p)}
            style={{
              display:"flex",alignItems:"center",gap:9,
              padding:"9px 18px",fontSize:12,fontWeight:500,
              color: activePage===item.p ? t.primary : t.textMid,
              background: activePage===item.p ? t.navActive : "transparent",
              borderLeft: `3px solid ${activePage===item.p ? t.primary : "transparent"}`,
              cursor:"pointer",transition:"all .1s",
            }}>
            <span style={{fontSize:16,width:20,textAlign:"center"}}>{item.i}</span>
            <span style={{flex:1}}>{item.l}</span>
            {item.badge && (
              <span style={{
                background:t.primary,color:t.bg==="#141414"?"#000":"#fff",
                borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:700,
              }}>{item.badge}</span>
            )}
          </div>
        ))}
      </nav>
      <div style={{padding:"14px 18px",borderTop:`1px solid ${t.border}`}}>
        <div style={{
          display:"flex",alignItems:"center",gap:8,
          fontSize:12,color:t.textMid,cursor:"pointer",padding:"6px 0",
        }}>🚪 &nbsp; Logout</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [role,  setRole]    = useState("owner");
  const [page,  setPage]    = useState("owner");
  const t = T.web6;

  const roleMap = {
    company_owner: "owner",
    store_manager: "owner",
    delivery_manager: "delivery",
    delivery_boy: "delivery",
    stock_manager: "stock",
  };
  const pageToRole = {
    owner:"owner",reports:"owner",customers:"owner",orders:"owner",
    deliveries:"delivery",inventory:"stock",
    delivery:"delivery",all:"delivery",drivers:"delivery",map:"delivery",
    mydeliveries:"delivery",pool:"delivery",
    stock:"stock",count:"stock",low:"stock",moves:"stock",value:"stock",dead:"stock",
  };

  function handlePage(p) {
    setPage(p);
    const r = pageToRole[p];
    if (r) setRole(r);
  }

  // Reads role from login payload saved by auth flow (or from URL for quick QA).
  const roleFromQuery = new URLSearchParams(window.location.search).get("role_code");
  const roleFromStorage = (() => {
    try {
      return localStorage.getItem("role_code");
    } catch {
      return null;
    }
  })();
  const roleCode = roleFromQuery || roleFromStorage;
  const mappedRole = roleCode ? roleMap[roleCode] : null;
  useEffect(() => {
    if (mappedRole) {
      setRole(mappedRole);
      setPage(mappedRole);
    }
  }, [mappedRole]);

  return (
    <div style={{fontFamily:t.font,background:t.bg,minHeight:"100vh"}}>
      {/* ── Web6 + Role Preview Switcher Bar ── */}
      <div style={{
        background:t.sidebar,borderBottom:`1px solid ${t.border}`,
        padding:"10px 20px",display:"flex",alignItems:"center",gap:12,
        position:"sticky",top:0,zIndex:300,flexWrap:"wrap",
      }}>
        <div style={{fontSize:13,fontWeight:700,color:t.textMid,marginRight:4}}>Theme:</div>
        <button style={{
          padding:"6px 14px",borderRadius:20,border:"none",
          background:t.primary,color:"#fff",
          fontSize:12,fontWeight:600,border:`1px solid ${t.border}`,
        }}>🌙 Web6 Dark</button>
        <div style={{width:1,height:24,background:t.border,margin:"0 6px"}}/>
        <div style={{fontSize:13,fontWeight:700,color:t.textMid,marginRight:4}}>Role:</div>
        {[
          ["owner","👔 Company Owner"],
          ["delivery","🚚 Delivery"],
          ["stock","📦 Stock Manager"],
        ].map(([v,l])=>(
          <button key={v} onClick={()=>{setRole(v);setPage(v)}} style={{
            padding:"6px 14px",borderRadius:20,border:`1px solid ${t.border}`,
            cursor:"pointer",
            background:role===v?t.primary:t.card,
            color:role===v?(t.bg==="#141414"?"#000":"#fff"):t.textMid,
            fontSize:12,fontWeight:600,
          }}>{l}</button>
        ))}
        <div style={{marginLeft:"auto",fontSize:11,color:t.textSoft}}>
          Preview — {t.label} {roleCode ? `(${roleCode})` : ""}
        </div>
      </div>

      {/* ── Dashboard Layout ── */}
      <div style={{display:"flex"}}>
        <Sidebar t={t} activeRole={role} activePage={page} onPage={handlePage}/>
        <div style={{flex:1,minWidth:0}}>
          {/* Topbar */}
          <div style={{
            background:t.topbar,borderBottom:`1px solid ${t.border}`,
            padding:"13px 24px",display:"flex",
            alignItems:"center",justifyContent:"space-between",
            position:"sticky",top:53,zIndex:99,
          }}>
            <div style={{fontSize:16,fontWeight:700,color:t.text}}>
              {role==="owner" && "Sales Dashboard"}
              {role==="delivery" && "Delivery Dashboard"}
              {role==="stock" && "Stock Management"}
            </div>
            <div style={{display:"flex",gap:8}}>
              {["🔔","⬇️","⚙️"].map(ic=>(
                <div key={ic} style={{
                  width:34,height:34,borderRadius:9,
                  background:t.card,border:`1px solid ${t.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,cursor:"pointer",
                }}>{ic}</div>
              ))}
            </div>
          </div>
          {/* Content */}
          <div style={{padding:"20px 24px"}}>
            {role==="owner"    && <OwnerDashboard    t={t}/>}
            {role==="delivery" && <DeliveryDashboard t={t}/>}
            {role==="stock"    && <StockDashboard    t={t}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
