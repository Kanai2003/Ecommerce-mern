import { Link } from "react-router-dom"
import { FaTrash } from "react-icons/fa"


type cartItemProps = {
  CartItem: any
}

const CartItem = ({CartItem}:cartItemProps) => {
  const {productId, photo, name,  price, stock} = CartItem
  return (
    <div className="cart-item">
      <img src={photo} alt={name}/>
      <article>
        <Link to={`/product/${productId}`}>{name}</Link>
        <span>₹ {price}</span>
      </article>
      <div>
        <button>-</button>
        <p>{stock}</p>
        <button>+</button>
      </div>
      <div>
        <FaTrash/>
      </div>
    </div>
  )
}

export default CartItem