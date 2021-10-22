import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const addProductFactories = {
        getCurrentProduct: async (id:number):Promise<Product> => {
          const cartProduct = cart.find(item=>item.id===id)
          if (cartProduct) return {...cartProduct}
          const { data: productData } = await api.get(`products/${id}`)
          return {
            ...productData,
            amount: 0
          } as Product
        },
        getProductStockAmount: async (id:number):Promise<number> => {
          const { data: productsStock } = await api.get(`stock/${id}`)
          const { amount } = productsStock//.find((stockItem:Stock)=>stockItem.id===id)
          return amount
        },
        setProductInCart: (product:Product):Product[]=>{
          const newCart = [...cart]
          const cartProductIndex = newCart.findIndex(item=>item.id===product.id)
          if(cartProductIndex>=0)
            newCart[cartProductIndex] = product
          else
            newCart.push(product)

          return newCart
        },
      }

      const newProduct = await addProductFactories.getCurrentProduct(productId)
      newProduct.amount++

      const productAmount = await addProductFactories.getProductStockAmount(productId)

      if(productAmount<newProduct.amount){
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        const newCart = addProductFactories.setProductInCart(newProduct)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
      
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = async(productId: number) => {
    try {
      const cartProduct = cart.find(item=>item.id===productId)
      if(cartProduct) {
        const newCart = cart.filter(item=>item.id!==productId)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw new Error("Product does not exist");
        
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updateProductAmountFactories = {
        getCurrentProduct: async (id:number):Promise<Product> => {
          const cartProduct = cart.find(item=>item.id===id)
          if (cartProduct) return {...cartProduct}
          const { data: productData } = await api.get(`products/${id}`)
          return {
            ...productData,
            amount: 0
          } as Product
        },
        getProductStockAmount: async (id:number):Promise<number> => {
          const { data: productsStock } = await api.get(`stock/${id}`)
          const { amount } = productsStock//.find((stockItem:Stock)=>stockItem.id===id)
          return amount
        },
        setProductInCart: (product:Product):Product[]=>{
          const newCart = [...cart]
          const cartProductIndex = newCart.findIndex(item=>item.id===product.id)
          if(cartProductIndex>=0)
            newCart[cartProductIndex] = product
          else
            newCart.push(product)

          return newCart
        },
      }

      const updatingProduct = await updateProductAmountFactories.getCurrentProduct(productId)
      updatingProduct.amount = amount

      const productAmount = await updateProductAmountFactories.getProductStockAmount(productId)

      if(productAmount<updatingProduct.amount){
        toast.error('Quantidade solicitada fora de estoque')
      } else if(updatingProduct.amount<=0){
        return undefined
      } else {
        const newCart = updateProductAmountFactories.setProductInCart(updatingProduct)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
