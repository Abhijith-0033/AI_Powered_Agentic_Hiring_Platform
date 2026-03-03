import React, { useState, useEffect } from 'react';
import { Search, Trash2, Ghost } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Button, Badge, Input, Table } from '../../components/ui';
import api from '../../api/axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            if (response.data?.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSoftDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to soft-delete this user?')) return;

        try {
            const response = await api.delete(`/admin/users/${userId}`);
            if (response.data?.success) {
                alert('User soft-deleted successfully');
                fetchUsers();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error soft-deleting user');
        }
    };

    const handleImpersonate = async (userId) => {
        try {
            const response = await api.post(`/admin/impersonate/${userId}`);
            if (response.data?.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                // Also update user in localstorage based on AuthContext logic if needed
                localStorage.setItem('user', JSON.stringify(user));

                const redirectPath = user.role === 'recruiter' ? '/provider/dashboard' : '/user/dashboard';
                window.location.href = redirectPath;
            }
        } catch (error) {
            console.error('Impersonation error:', error);
            alert('Failed to impersonate user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (_, user) => (
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">{user.name}</span>
                    <span className="text-xs text-neutral-500">{user.email}</span>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: 'role',
            render: (role) => (
                <Badge variant={role === 'admin' ? 'secondary' : (role === 'recruiter' ? 'primary' : 'success')}>
                    {role?.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Status',
            accessor: 'is_deleted',
            render: (isDeleted) => (
                <Badge variant={isDeleted ? 'error' : 'success'}>
                    {isDeleted ? 'Deleted' : 'Active'}
                </Badge>
            )
        },
        {
            header: 'Joined',
            accessor: 'created_at',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
        },
        {
            header: 'Actions',
            accessor: 'id',
            render: (id, user) => (
                <div className="flex items-center gap-2">
                    {user.role !== 'admin' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImpersonate(id)}
                                title="Impersonate"
                            >
                                <Ghost className="w-4 h-4 text-purple-600" />
                            </Button>
                            {!user.is_deleted && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSoftDelete(id)}
                                    title="Soft Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <DashboardLayout type="admin" title="User Management">
            <div className="mb-6 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search users by name or email..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm">Refresh</Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <Table
                    columns={columns}
                    data={filteredUsers}
                    loading={loading}
                />
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
