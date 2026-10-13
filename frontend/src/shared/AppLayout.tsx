import { Link, Outlet } from 'react-router-dom';

/**
 * Application shell — the React port of index.html's navbar + `<div ng-view>`.
 *
 * The `ng-view` attribute is kept on the content wrapper on purpose: css/app.css
 * styles the main content card through the `.container-fluid > [ng-view]`
 * selector, and the behavioural suite scopes its heading lookups to `[ng-view]`.
 */
export function AppLayout() {
  return (
    <>
      <nav className="navbar navbar-default" role="navigation">
        <div className="container-fluid">
          <div className="navbar-header">
            <Link className="navbar-brand" to="/dashboard">
              Inventory &amp; Order Management
            </Link>
          </div>
          <ul className="nav navbar-nav">
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/customers">Customers</Link>
            </li>
            <li>
              <Link to="/orders">Orders</Link>
            </li>
            <li>
              <Link to="/invoices">Invoices</Link>
            </li>
            <li>
              <Link to="/notifications">Notifications</Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container-fluid">
        <div ng-view="">
          <Outlet />
        </div>
      </div>
    </>
  );
}
