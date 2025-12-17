import { setTimeout } from 'node:timers/promises'

export const wait = (timeInMilliseconds: number) => setTimeout(timeInMilliseconds)
