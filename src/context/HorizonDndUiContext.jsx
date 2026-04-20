import { createContext, useContext } from 'react'

export const HorizonDndUiContext = createContext(null)

export function useHorizonDndUi() {
  return useContext(HorizonDndUiContext)
}
