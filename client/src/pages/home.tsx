import React from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

const Home = () => {

    const addToCartHandler = () => {}

  return (
    <div className='home'>
      <section></section>

      <h1>
        Latest Product
        <Link to="/search" className="findmore">More</Link>
      </h1>

      <main>
        <ProductCard
          productId="id"
          photo="https://cdn.thewirecutter.com/wp-content/media/2023/06/bestlaptops-2048px-9765.jpg?auto=webp&quality=75&crop=1.91:1&width=1200"
          name="camera"
          price={50000}
          stock={1}
          handler={addToCartHandler}
        />
      </main>

    </div>
  )
}

export default Home