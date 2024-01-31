import { FaPlus } from "react-icons/fa6" 

type productProps = {
    productId: string;
    photo: string;
    name: string;
    price: number;
    stock: number;
    handler: () => void;
}

const server = ""

const ProductCard = ({
    productId,
    photo,
    name,
    price,
    stock,
    handler
}: productProps) => {
    return (
        <div className="product-card">
            <img src={`${server}/${photo}`} alt={name}/>
            <p>{name}</p>
            <span>₹{price}</span>
            <div>
                <button onClick={()=>handler()}>
                    <FaPlus/>
                </button>
            </div>
        </div>
    )
}

export default ProductCard