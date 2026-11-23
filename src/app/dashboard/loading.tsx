export default function DashboardLoading() {
  return <main className="dashboard-content" aria-busy="true">
    <p className="sr-only" role="status">Loading your subscription dashboard</p>
    <div className="page-heading dashboard-loading-heading" aria-hidden="true">
      <div><span className="loading-line loading-kicker"/><span className="loading-line loading-title"/><span className="loading-line loading-subtitle"/></div>
      <span className="loading-line loading-button"/>
    </div>
    <section className="metric-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => <article className="metric-card" key={index}>
        <span className="loading-line loading-metric-label"/><span className="loading-line loading-metric-value"/><span className="loading-line loading-metric-hint"/>
      </article>)}
    </section>
    <div className="dashboard-columns" aria-hidden="true">
      <section className="panel spending-panel loading-panel"><span className="loading-line loading-panel-title"/><span className="loading-line loading-panel-caption"/><div className="loading-chart"/></section>
      <section className="panel upcoming-panel loading-panel"><span className="loading-line loading-panel-title"/><span className="loading-line loading-panel-caption"/>{Array.from({ length: 4 }, (_, index) => <div className="loading-payment" key={index}><span className="loading-circle"/><span className="loading-line loading-payment-name"/><span className="loading-line loading-payment-amount"/></div>)}</section>
    </div>
    <section className="panel loading-table" aria-hidden="true"><span className="loading-line loading-panel-title"/><span className="loading-line loading-panel-caption"/>{Array.from({ length: 3 }, (_, index) => <span className="loading-table-row" key={index}/>)}</section>
  </main>;
}
