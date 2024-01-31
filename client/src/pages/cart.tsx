import { useEffect, useState } from 'react'
import { VscError } from 'react-icons/vsc'
import CartItem from '../components/cart-item'

const cartItems = [
  {
    "productId": "adfa",

    "photo": "https://cdn.thewirecutter.com/wp-content/media/2023/06/bestlaptops-2048px-9765.jpg?auto=webp&quality=75&crop=1.91:1&width=1200",
    "name": "camera",
    "price": 5000,
    "stock": 5
  }
]
const subtotal = 4000
const tax = Math.round(subtotal * 0.18)
const shippingCharges = 200
const discount = 400
const total = subtotal + tax + shippingCharges

const Cart = () => {

  const [couponCode, setCouponCode] = useState<string>("");
  const [isValidCouponCode, setIsValidCouponCode] = useState<boolean>(false);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      if (Math.random() > 0.5) {
        setIsValidCouponCode(true)
      } else {
        setIsValidCouponCode(false)
      }
    }, 1000)

    return () => {
      clearTimeout(timeOutId)
    }
  }, [couponCode])

  return (
    <div className='cart'>
      <main>
        {cartItems.length > 0 ? cartItems.map((item, idx) =>(
          <CartItem CartItem={item}/>
        ) ):<h1>No items added</h1>}
      </main>

      <aside>
        <p>Subtotal: {subtotal}</p>
        <p>Shipping Charges: {shippingCharges}</p>
        <p>Tax: {tax}</p>
        <p>
          Discount: <em className='red'> {discount}</em>
        </p>
        <p>
          <b>Total: {total}</b>
        </p>
        <input
          type="text"
          value={couponCode}
          placeholder='Enter Coupon code'
          onChange={(e) => setCouponCode(e.target.value)}
        />
        {
          couponCode && (isValidCouponCode ? (
            <span className='green'>
              ₹ {discount} off using <code>{couponCode}</code>
            </span>
          ) : (
            <span className='red'>
              Ivalid Coupon <VscError />
            </span>
          ))
        }

      </aside>
    </div>
  )
}

export default Cart