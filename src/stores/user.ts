import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Member } from '../models/member'
import { storage, KEYS } from '../utils/storage'
import { levelOf, levelName } from '../services/member.service'

const EMPTY: Member = { id: '', nickname: '', avatar: '', points: 0, totalSpent: 0 }
export const useUserStore = defineStore('user', () => {
  const member = ref<Member>(storage.get<Member | null>(KEYS.user, null) ?? { ...EMPTY })
  const save = (m: Member) => { member.value = m; storage.set(KEYS.user, m) }
  const login = (nickname: string, avatar: string) => save({ ...member.value, id: `u${Date.now()}`, nickname, avatar })
  const addPoints = (n: number) => save({ ...member.value, points: member.value.points + n })
  const deductPoints = (n: number) => save({ ...member.value, points: Math.max(0, member.value.points - n) })
  const addSpend = (amount: number) => save({ ...member.value, totalSpent: member.value.totalSpent + amount })
  const isLogin = () => !!member.value.id
  const level = () => levelOf(member.value.totalSpent)
  return { member, login, addPoints, deductPoints, addSpend, isLogin, level, levelName }
})
