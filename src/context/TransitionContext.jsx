import { createContext, useContext } from 'react'

export const TransitionContext = createContext(null)

export function TransitionProvider({ children, value }) {
  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  )
}

export const useTransition = () => useContext(TransitionContext)
