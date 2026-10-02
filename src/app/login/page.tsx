'use client';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { User as UserIcon, Shield } from 'lucide-react';

import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const { login, currentUser } = useAppStore();
  const router = useRouter();
  const mounted = useMounted();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mounted && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = await loginUser(username, password);
      if (user) {
        login(user);
        router.push('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login.');
    }
  };

  if (!mounted || currentUser) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-50">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">Megha Infotech</CardTitle>
          <CardDescription className="text-base text-slate-500">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100 text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="e.g. admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-4">
            <Button className="w-full h-11 text-base font-semibold" type="submit">Sign In</Button>
            
            <div className="mt-6 w-full">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or quick login as</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  onClick={async () => {
                    setUsername('john');
                    setPassword('password');
                    const user = await loginUser('john', 'password');
                    if (user) {
                      login(user);
                      router.push('/dashboard');
                    }
                  }}
                >
                  <UserIcon className="mr-2 h-4 w-4" /> User
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={async () => {
                    setUsername('admin');
                    setPassword('password');
                    const user = await loginUser('admin', 'password');
                    if (user) {
                      login(user);
                      router.push('/dashboard');
                    }
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
