import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader.js'
import Header from './components/Header.js'


const Home = lazy(() => import("./pages/home.js"))
const Search = lazy(() => import("./pages/search.js"))
const Cart = lazy(() => import("./pages/cart.js"))
const Shipping = lazy(() => import('./pages/shipping.js'))
const Orders = lazy(() => import('./pages/orders.js'))
const OrderDetails = lazy(() => import('./pages/order-details.js'))


// Admin Routes Importing
const Dashboard = lazy(() => import("./pages/admin/dashboard.js"));
const Products = lazy(() => import("./pages/admin/products.js"));
const Customers = lazy(() => import("./pages/admin/customers.js"));
const Transaction = lazy(() => import("./pages/admin/transaction.js"));
const Barcharts = lazy(() => import("./pages/admin/charts/barcharts.js"));
const Piecharts = lazy(() => import("./pages/admin/charts/piecharts.js"));
const Linecharts = lazy(() => import("./pages/admin/charts/linecharts.js"));
const Coupon = lazy(() => import("./pages/admin/apps/coupon.js"));
const Stopwatch = lazy(() => import("./pages/admin/apps/stopwatch.js"));
const Toss = lazy(() => import("./pages/admin/apps/toss.js"));
const NewProduct = lazy(() => import("./pages/admin/management/newproduct.js"));
const ProductManagement = lazy(() => import("./pages/admin/management/productmanagement.js"));
const TransactionManagement = lazy(() => import("./pages/admin/management/transactionmanagement.js"));



const App = () => {
  return (
    <Router>
      <Header />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/search' element={<Search />} />
          <Route path='/cart' element={<Cart />} />

          {/* Logged In user Routes */}
          <Route>
            <Route path='/shipping' element={<Shipping />} />
            <Route path='/orders' element={<Orders />} />
          <Route path='/order/:id' element={<OrderDetails/>} />

          </Route>

          {/* Admin routes */}
          {/* <Route
            element={
              <ProtectedRoute isAuthenticated={true} adminRoute={true} isAdmin={true} />
            }
          > */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/product" element={<Products />} />
          <Route path="/admin/customer" element={<Customers />} />
          <Route path="/admin/transaction" element={<Transaction />} />
          {/* Charts */}
          <Route path="/admin/chart/bar" element={<Barcharts />} />
          <Route path="/admin/chart/pie" element={<Piecharts />} />
          <Route path="/admin/chart/line" element={<Linecharts />} />
          {/* Apps */}
          <Route path="/admin/app/coupon" element={<Coupon />} />
          <Route path="/admin/app/stopwatch" element={<Stopwatch />} />
          <Route path="/admin/app/toss" element={<Toss />} />

          {/* Management */}
          <Route path="/admin/product/new" element={<NewProduct />} />

          <Route path="/admin/product/:id" element={<ProductManagement />} />

          <Route path="/admin/transaction/:id" element={<TransactionManagement />} />
          {/* </Route>; */}


        </Routes>
      </Suspense>
    </Router>
  )
}

export default App