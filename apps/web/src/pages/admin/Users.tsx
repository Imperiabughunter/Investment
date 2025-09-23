import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Switch } from 'antd';
import { UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import AdminLayout from '../../components/layouts/AdminLayout';
import api from '../../services/api';

const { confirm } = Modal;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, isActive) => {
    confirm({
      title: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`,
      icon: <ExclamationCircleOutlined />,
      content: `This will ${isActive ? 'prevent' : 'allow'} the user from accessing the system.`,
      onOk: async () => {
        try {
          if (isActive) {
            await api.put(`/admin/users/${userId}/deactivate`);
            message.success('User deactivated successfully');
          } else {
            await api.put(`/admin/users/${userId}/activate`);
            message.success('User activated successfully');
          }
          fetchUsers(); // Refresh the user list
        } catch (error) {
          message.error(`Failed to ${isActive ? 'deactivate' : 'activate'} user`);
          console.error(error);
        }
      },
    });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Switch
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          checked={record.is_active}
          onChange={() => handleStatusChange(record.id, record.is_active)}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '20px' }}>
        <h1>User Management</h1>
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="Search by username or email"
            prefix={<UserOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
};

export default Users;