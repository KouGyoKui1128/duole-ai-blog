'use client'

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser, deleteUser, getMe, getUsers, updateUser, type CurrentUser, type UserItem, type UserRole } from "@/lib/admin-api"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [me, setMe] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("editor")

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [currentUser, userList] = await Promise.all([getMe(), getUsers()])
      setMe(currentUser)
      setUsers(userList)
    } catch {
      setError("加载用户失败，请确认当前账号为管理员")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async () => {
    if (!username || !email || !password) return
    try {
      await createUser({ username, email, password, role })
      setUsername("")
      setEmail("")
      setPassword("")
      setRole("editor")
      await loadData()
    } catch {
      setError("创建用户失败，请检查字段是否重复")
    }
  }

  const handleRoleChange = async (user: UserItem, nextRole: UserRole) => {
    try {
      await updateUser(user.id, { role: nextRole })
      await loadData()
    } catch {
      setError("更新角色失败")
    }
  }

  const handleActiveChange = async (user: UserItem, nextActive: boolean) => {
    try {
      await updateUser(user.id, { is_active: nextActive })
      await loadData()
    } catch {
      setError("更新状态失败")
    }
  }

  const handleDelete = async (user: UserItem) => {
    try {
      await deleteUser(user.id)
      await loadData()
    } catch {
      setError("删除用户失败")
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">正在加载用户...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">用户与权限管理</h1>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardContent className="p-4 grid gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="username">用户名</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">初始密码</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>角色</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <Button onClick={handleCreate}>创建用户</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                  className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                </select>

                <Button variant="outline" onClick={() => handleActiveChange(user, !user.is_active)}>
                  {user.is_active ? "禁用" : "启用"}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDelete(user)}
                  disabled={me?.id === user.id}
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
