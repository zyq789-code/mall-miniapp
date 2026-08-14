import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Member } from '../models/member'
import { storage, KEYS } from '../utils/storage'
import { levelOf, levelName } from '../services/member.service'
import { ApiError } from '../api/request'
import { useCartStore } from './cart'
import {
  login as apiLogin,
  register as apiRegister,
  getProfile,
  updateProfile as apiUpdateProfile,
  signin as apiSignin,
} from '../api/user.api'

const EMPTY: Member = { id: '', username: '', nickname: '', avatar: '', points: 0, totalSpent: 0, lastSignIn: null }

/**
 * 用户账号体系（后端驱动）。
 * member 资料/积分/签到均来自 /api/user/*，token 存 localStorage（KEYS.userToken）。
 * 下单返积分/扣积分尚未有后端接口，本地保留乐观更新（见 addPoints/deductPoints/addSpend），
 * 待 U-C 把积分完整搬到后端后移除。
 */
export const useUserStore = defineStore('user', () => {
  const member = ref<Member>({ ...EMPTY })
  const token = ref<string>(storage.get<string>(KEYS.userToken, ''))

  const isLogin = () => !!token.value

  async function login(username: string, password: string): Promise<void> {
    const res = await apiLogin(username, password)
    token.value = res.token
    storage.set(KEYS.userToken, res.token)
    member.value = res.user
    // 切换账号后清空本地购物车快照，避免泄漏上一个用户的数据（购物车页 onShow 会重新拉取）
    useCartStore().clear()
  }

  async function register(username: string, password: string, nickname?: string): Promise<void> {
    const res = await apiRegister(username, password, nickname)
    token.value = res.token
    storage.set(KEYS.userToken, res.token)
    member.value = res.user
    useCartStore().clear()
  }

  /** 拉取后端资料（页面 onShow 时调用）；token 失效（401）则自动退出。 */
  async function fetchProfile(): Promise<void> {
    if (!isLogin()) { member.value = { ...EMPTY }; return }
    try {
      member.value = await getProfile()
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) logout()
    }
  }

  async function updateProfile(patch: { nickname?: string; avatar?: string }): Promise<void> {
    member.value = await apiUpdateProfile(patch)
  }

  /** 每日签到（后端 +10 并返回最新积分/签到日），成功后同步本地。 */
  async function signin(): Promise<void> {
    const res = await apiSignin()
    member.value = { ...member.value, points: res.points, lastSignIn: res.lastSignIn }
  }

  function logout(): void {
    token.value = ''
    member.value = { ...EMPTY }
    storage.remove(KEYS.userToken)
    useCartStore().clear()
  }

  // ---- 本地乐观更新（下单返积分/扣积分无后端接口，U-C 时整体搬到后端）----
  const addPoints = (n: number) => { member.value = { ...member.value, points: member.value.points + n } }
  const deductPoints = (n: number) => { member.value = { ...member.value, points: Math.max(0, member.value.points - n) } }
  const addSpend = (amount: number) => { member.value = { ...member.value, totalSpent: member.value.totalSpent + amount } }

  const level = () => levelOf(member.value.totalSpent)

  return {
    member, token, isLogin, login, register, logout, fetchProfile, updateProfile, signin,
    addPoints, deductPoints, addSpend, level, levelName,
  }
})
