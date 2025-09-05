'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'demo123'
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate login delay for demo purposes
    setTimeout(() => {
      setLoading(false)
      // Redirect to dashboard after successful login
      router.push('/dashboard')
    }, 1000)
  }

  const handleQuickLogin = () => {
    setLoading(true)
    // Immediate login for demo purposes
    setTimeout(() => {
      setLoading(false)
      router.push('/dashboard')
    }, 500)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Demo Portal</CardTitle>
          <CardDescription>
            Corporate and Franchisor Views - Use any credentials or click Quick Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required 
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleQuickLogin}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Quick Login (Demo)'}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Demo Application - No real authentication required
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
