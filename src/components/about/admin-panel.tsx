"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Copy, Plus, Trash2, UserPlus, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Ticket } from "lucide-react";
import { useAdminCheck } from '@/hooks/use-admin-check';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  username: string;
  invite_key: string | null;
  created_at: string;
  is_admin: boolean;
  status: 'pending' | 'registered' | 'regenerated';
}

export function AdminPanel() {
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showUUIDs, setShowUUIDs] = useState<Record<string, boolean>>({});
  const { data: isAdmin } = useAdminCheck();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isFetching } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const profileId = localStorage.getItem('profileId');
      const response = await fetch('/api/admin/users', {
        headers: { 'X-Profile-Id': profileId || '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.users;
    },
    staleTime: Infinity,
  });

  const refreshUsers = () => {
    if (isLoading || isFetching) return;
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const toggleShowKey = (userId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleShowUUID = (userId: string) => {
    setShowUUIDs(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const profileId = localStorage.getItem('profileId');
      
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const response = await fetch('/api/admin/invite/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Profile-Id': profileId
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate invite');
      }

      alert(`Invite generated for ${username}`);
      setIsOpen(false);
      refreshUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate invite');
    }
  };

  const regenerateInvite = async (username: string) => {
    setError(null);
    
    try {
      const profileId = localStorage.getItem('profileId');
      
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const response = await fetch('/api/admin/invite/regenerate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Profile-Id': profileId
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate invite');
      }

      alert(`Invite regenerated for ${username}`);
      refreshUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate invite');
    }
  };

  const removeUser = async (username: string) => {
    if (!confirm(`Are you sure you want to remove user "${username}" and all their data? This cannot be undone.`)) {
      return;
    }

    setError(null);
    
    try {
      const profileId = localStorage.getItem('profileId');
      
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const response = await fetch('/api/admin/user/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Profile-Id': profileId
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove user');
      }

      alert(data.message);
      refreshUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove user');
    }
  };

  const clearUnusedInvites = async () => {
    if (!confirm('Are you sure you want to clear all unused invites?')) {
      return;
    }

    try {
      const profileId = localStorage.getItem('profileId');
      
      if (!profileId) {
        throw new Error('No profile ID found');
      }

      const response = await fetch('/api/admin/invite/clear', { 
        method: 'POST',
        headers: {
          'X-Profile-Id': profileId
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(data.message);
      refreshUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to clear invites');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
        return;
      }

      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        alert('Copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text:', err);
        alert('Failed to copy to clipboard');
      }

      document.body.removeChild(textArea);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: User['status'], isAdmin: boolean) => {
    const styles = {
      pending: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      registered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      regenerated: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    };

    const labels = {
      pending: "Inactive",
      registered: "User",
      regenerated: "Regenerated",
      admin: "Admin"
    };

    if (isAdmin) {
      return (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs",
          styles.admin
        )}>
          Admin
        </span>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs",
          styles[status]
        )}>
          {labels[status]}
        </span>
      </div>
    );
  };

  const clearChat = async () => {
    if (!confirm('Are you sure you want to delete ALL chat messages? This cannot be undone!')) {
        return;
    }

    try {
        const profileId = localStorage.getItem('profileId');
        
        if (!profileId) {
            throw new Error('No profile ID found');
        }

        const response = await fetch('/api/admin/chat/clear', { 
            method: 'POST',
            headers: {
                'X-Profile-Id': profileId
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        alert(data.message);
    } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to clear chat');
    }
  };

  const terminateConnections = async () => {
    try {
      const response = await fetch('/api/admin/pusher/terminate', { method: 'POST' });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to terminate connections');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap justify-between">
        <h2 className="text-xl mb-4 font-semibold">User Management</h2>
        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="h-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
              </DialogHeader>
              <form onSubmit={generateInvite} className="space-y-4">
                <Input
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Generate Invite
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="destructive" 
            onClick={clearUnusedInvites}
            className="h-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Invites
          </Button>

          <Button 
            variant="destructive" 
            onClick={clearChat}
            className="h-full"
          >
            Clear Chat
          </Button>

          <Button
            variant="destructive"
            className="h-full"
            onClick={terminateConnections}
          >
            Terminate Connections
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[500px]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="w-[500px]">
                  {getStatusBadge(user.status, user.is_admin)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowUUID(user.id)}
                    >
                      {showUUIDs[user.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="ml-2">UUID</span>
                    </Button>

                    {user.invite_key && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowKey(user.id)}
                      >
                        {showKeys[user.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="ml-2">Key</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateInvite(user.username)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUser(user.username)}
                      disabled={user.is_admin}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {showUUIDs[user.id] && (
                    <div className="mt-2 text-sm">
                      <code className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {user.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {showKeys[user.id] && user.invite_key && (
                    <div className="mt-2 text-sm">
                      <code className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {user.invite_key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.invite_key!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshUsers}
          className="text-muted-foreground hover:text-foreground"
          disabled={isLoading || isFetching}
        >
          <RefreshCw 
            className={cn(
              "h-4 w-4 mr-2 transition-transform duration-500 ease-in-out",
              (isLoading || isFetching) ? "animate-spin" : "hover:rotate-180"
            )}
          />
          {(isLoading || isFetching) ? 'Refreshing...' : 'Refresh List'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}